import streamlit as st
import json
import os
import time
import uuid
from datetime import datetime
import pandas as pd
import re

# Import ported logic
from prompts import PROMPTS, JD_TEMPLATES
from api_client import call_ai, parse_score, strip_meta, PROVIDERS

# --- Persistence ---
STORE_FILE = "validator_store.json"
USERS_FILE = "validator_users.json"
LOGS_FILE = "validator_logs.json"

def load_json(file, default):
    if os.path.exists(file):
        with open(file, "r") as f:
            return json.load(f)
    return default

def save_json(file, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=2)

# --- App State ---
if "user" not in st.session_state:
    st.session_state.user = None
if "store" not in st.session_state:
    st.session_state.store = load_json(STORE_FILE, {})
if "users" not in st.session_state:
    st.session_state.users = load_json(USERS_FILE, {
        "admin@validator.ai": {"email": "admin@validator.ai", "pw": "admin123", "role": "admin"}
    })
if "logs" not in st.session_state:
    st.session_state.logs = load_json(LOGS_FILE, [])
if "tab" not in st.session_state:
    st.session_state.tab = "jd"

def log_activity(user, action, msg):
    log_entry = {
        "user": user["email"],
        "action": action,
        "msg": msg,
        "ts": datetime.now().isoformat()
    }
    st.session_state.logs.append(log_entry)
    save_json(LOGS_FILE, st.session_state.logs)

def save_store():
    save_json(STORE_FILE, st.session_state.store)

# --- UI Configuration ---
st.set_page_config(page_title="Validator AI", page_icon="⚡", layout="wide")

# --- Custom CSS ---
st.markdown("""
<style>
    .stButton>button { width: 100%; border-radius: 10px; font-weight: 600; }
    .card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #f0f2f7; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-core { background: #eef0ff; color: #5b6af5; }
    .badge-secondary { background: #f5f3ff; color: #7c3aed; }
</style>
""", unsafe_allow_html=True)

# --- Authentication Logic ---
def login_page():
    st.title("Validator ⚡")
    st.markdown("### AI Recruiting Intelligence")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        mode = st.radio("Choose", ["Login", "Register"], horizontal=True)
        email = st.text_input("Email")
        pw = st.text_input("Password", type="password")
        
        if mode == "Login":
            if st.button("Sign In"):
                if email in st.session_state.users and st.session_state.users[email]["pw"] == pw:
                    st.session_state.user = st.session_state.users[email]
                    log_activity(st.session_state.user, "login", "User logged in")
                    st.rerun()
                else:
                    st.error("Invalid email or password")
        else:
            if st.button("Create Account"):
                if email in st.session_state.users:
                    st.error("User already exists")
                elif not email or not pw:
                    st.error("Please fill all fields")
                else:
                    new_user = {"email": email, "pw": pw, "role": "user"}
                    st.session_state.users[email] = new_user
                    save_json(USERS_FILE, st.session_state.users)
                    st.session_state.user = new_user
                    log_activity(new_user, "register", "New user registered")
                    st.rerun()

# --- Main Application ---
if not st.session_state.user:
    login_page()
else:
    # --- Sidebar ---
    with st.sidebar:
        st.title("Validator ⚡")
        st.caption(f"Logged in as: {st.session_state.user['email']}")
        st.divider()
        
        menu = [
            ("jd", "📋 Job Description"),
            ("cv", "👤 Evaluate CV"),
            ("compare", "⚖️ Compare"),
            ("pipeline", "📊 Pipeline"),
            ("linkedin", "🔗 LinkedIn"),
            ("outreach", "✉️ Outreach"),
            ("guide", "📖 Guide"),
            ("settings", "⚙️ Settings"),
        ]
        if st.session_state.user["role"] == "admin":
            menu.append(("admin", "🛡️ Admin"))
            
        for tab_id, label in menu:
            if st.button(label, key=f"btn_{tab_id}"):
                st.session_state.tab = tab_id
                
        st.divider()
        if st.button("Logout"):
            log_activity(st.session_state.user, "logout", "User logged out")
            st.session_state.user = None
            st.rerun()

    # --- Router ---
    tab = st.session_state.tab
    
    # Common props
    ai_config = {
        "provider": st.session_state.user.get("provider", "anthropic"),
        "apiKey": st.session_state.user.get("apiKey", ""),
        "model": st.session_state.user.get("model", "")
    }

    # --- 📋 JD Setup ---
    if tab == "jd":
        st.header("Job Description Analysis")
        st.write("Analyze hiring intent and build a scoring framework.")
        
        col1, col2 = st.columns([1, 1])
        with col1:
            st.subheader("Role Definition")
            jd_name = st.text_input("JD Reference Name", placeholder="e.g. Senior Product Manager")
            
            with st.expander("Or use a Template"):
                for t in JD_TEMPLATES:
                    if st.button(f"{t['icon']} {t['name']}", key=f"tmpl_{t['name']}"):
                        st.session_state.jd_text = t['text']
                        st.session_state.jd_name = t['name']
            
            jd_text = st.text_area("Paste Job Description", value=st.session_state.get("jd_text", ""), height=300)
            
            if st.button("Analyze & Build Matrix"):
                if not ai_config["apiKey"]:
                    st.warning("Please set your API key in Settings first.")
                else:
                    with st.spinner("AI is analyzing hiring intent..."):
                        try:
                            analysis = call_ai(ai_config, PROMPTS["p1"](jd_text))
                            matrix = call_ai(ai_config, PROMPTS["p2"](analysis))
                            
                            jd_id = str(uuid.uuid4())[:8]
                            st.session_state.store[jd_id] = {
                                "id": jd_id,
                                "name": jd_name or "Untitled Role",
                                "text": jd_text,
                                "analysis": analysis,
                                "matrix": matrix,
                                "candidates": {},
                                "savedAt": time.time()
                            }
                            save_store()
                            log_activity(st.session_state.user, "p1_p2", f"Analyzed JD: {jd_name}")
                            st.success("JD Analyzed and Framework built!")
                        except Exception as e:
                            st.error(f"Error: {e}")

        with col2:
            st.subheader("Your Active JDs")
            for j_id, j in sorted(st.session_state.store.items(), key=lambda x: x[1]['savedAt'], reverse=True):
                with st.expander(f"{j['name']} ({len(j['candidates'])} candidates)"):
                    st.write(j['analysis'][:500] + "...")
                    if st.button("Delete JD", key=f"del_{j_id}"):
                        del st.session_state.store[j_id]
                        save_store()
                        st.rerun()

    # --- 👤 Evaluate CV ---
    elif tab == "cv":
        st.header("Candidate Evaluation")
        if not st.session_state.store:
            st.info("Please set up a Job Description first.")
        else:
            jd_options = {v["name"]: k for k, v in st.session_state.store.items()}
            selected_jd_name = st.selectbox("Context: Evaluating for", list(jd_options.keys()))
            selected_jd_id = jd_options[selected_jd_name]
            current_jd = st.session_state.store[selected_jd_id]
            
            cand_name = st.text_input("Candidate Name")
            cv_text = st.text_area("Paste CV Text", height=400)
            
            if st.button("Start AI Evaluation"):
                if not ai_config["apiKey"]:
                    st.warning("Please set your API key in Settings.")
                else:
                    with st.spinner("Analyzing CV against matrix..."):
                        try:
                            full_eval = call_ai(ai_config, PROMPTS["p3"](current_jd["analysis"], current_jd["matrix"], cv_text))
                            score_data = parse_score(full_eval)
                            
                            new_cand = {
                                "name": cand_name or "Anonymous Candidate",
                                "cv": cv_text,
                                "eval": full_eval,
                                "score": score_data,
                                "recommendation": score_data["recommendation"] if score_data else "Unknown",
                                "evaluatedAt": time.time()
                            }
                            st.session_state.store[selected_jd_id]["candidates"][new_cand["name"]] = new_cand
                            save_store()
                            log_activity(st.session_state.user, "p3", f"Evaluated candidate: {new_cand['name']} for {selected_jd_name}")
                            
                            st.balloons()
                            st.markdown("### Evaluation Results")
                            st.write(strip_meta(full_eval))
                        except Exception as e:
                            st.error(f"Error: {e}")

    # --- ⚖️ Compare ---
    elif tab == "compare":
        st.header("Candidate Comparison")
        if not st.session_state.store:
            st.info("No data to compare.")
        else:
            jd_options = {v["name"]: k for k, v in st.session_state.store.items()}
            sel_jd_id = jd_options[st.selectbox("Select JD Context", list(jd_options.keys()))]
            candidates = st.session_state.store[sel_jd_id]["candidates"]
            
            if not candidates:
                st.info("No candidates evaluated for this role.")
            else:
                sel_names = st.multiselect("Select Candidates to Compare", list(candidates.keys()))
                if len(sel_names) > 1:
                    if st.button("Generate Comparison Report"):
                        with st.spinner("Synthesizing side-by-side comparison..."):
                            sel_list = [candidates[name] for name in sel_names]
                            report = call_ai(ai_config, PROMPTS["compare"](st.session_state.store[sel_jd_id]["name"], sel_list))
                            st.markdown(report)
                else:
                    st.write("Select at least 2 candidates to compare.")

    # --- 📊 Pipeline ---
    elif tab == "pipeline":
        st.header("Hiring Pipeline")
        if not st.session_state.store:
            st.info("No candidates available.")
        else:
            jd_options = {v["name"]: k for k, v in st.session_state.store.items()}
            sel_jd_id = jd_options[st.selectbox("Select JD Context", list(jd_options.keys()))]
            candidates = st.session_state.store[sel_jd_id]["candidates"]
            
            if not candidates:
                st.info("No candidates found.")
            else:
                df = pd.DataFrame([
                    {"Name": c["name"], "Score": c["score"]["total"] if c["score"] else 0, "Rec": c["recommendation"]}
                    for c in candidates.values()
                ])
                st.dataframe(df.sort_values("Score", ascending=False), use_container_width=True)

    # --- 🔗 LinkedIn ---
    elif tab == "linkedin":
        st.header("LinkedIn Sourcing Strategy")
        if not st.session_state.store:
            st.info("Analyze a JD first to generate sourcing parameters.")
        else:
            jd_options = {v["name"]: k for k, v in st.session_state.store.items()}
            sel_jd_id = jd_options[st.selectbox("Context JD", list(jd_options.keys()))]
            
            if st.button("Generate Sourcing Parameters"):
                with st.spinner("Building boolean strings and filters..."):
                    result = call_ai(ai_config, PROMPTS["p6"](st.session_state.store[sel_jd_id]["analysis"]))
                    st.markdown(result)

    # --- ✉️ Outreach ---
    elif tab == "outreach":
        st.header("Outreach & Engagement")
        if not st.session_state.store:
            st.info("No candidate context available.")
        else:
            jd_options = {v["name"]: k for k, v in st.session_state.store.items()}
            sel_jd_id = jd_options[st.selectbox("Role Context", list(jd_options.keys()))]
            cands = st.session_state.store[sel_jd_id]["candidates"]
            
            if not cands:
                st.info("Evaluate a candidate first.")
            else:
                sel_cand = cands[st.selectbox("Candidate", list(cands.keys()))]
                
                col1, col2 = st.columns(2)
                with col1:
                    st.subheader("Message Generator")
                    msg_type = st.selectbox("Channel", ["email", "whatsapp"])
                    note = st.text_area("Custom Note (Optional)")
                    if st.button("Generate Outreach"):
                        with st.spinner("Writing personalized message..."):
                            msg = call_ai(ai_config, PROMPTS["outreachMsg"](
                                st.session_state.store[sel_jd_id]["name"],
                                sel_cand["name"], "", msg_type, note
                            ))
                            st.code(msg)
                
                with col2:
                    st.subheader("Email Finder")
                    if st.button("Predict Emails"):
                        with st.spinner("Predicting patterns..."):
                            emails = call_ai(ai_config, PROMPTS["emailFinder"](sel_cand["name"], f"Role: {st.session_state.store[sel_jd_id]['name']}"))
                            st.write(emails)

    # --- 📖 Guide ---
    elif tab == "guide":
        st.header("User Guide")
        st.markdown("""
        ### 🚀 Getting Started
        1. **Settings**: Add your API Key first.
        2. **Job Description**: Paste a JD and let AI build the matrix.
        3. **Evaluate CV**: Score candidates against the matrix.
        4. **Compare**: Pick multiple candidates for a side-by-side report.
        
        ### 💡 Pro Tips
        - Use **Groq** or **Gemini** for free-tier high performance.
        - **Claude 3.5 Sonnet** is the recommended model for precision.
        """)

    # --- ⚙️ Settings ---
    elif tab == "settings":
        st.header("Configuration")
        
        st.subheader("AI Provider & Model")
        new_provider = st.selectbox("Provider", list(PROVIDERS.keys()), 
                                   index=list(PROVIDERS.keys()).index(st.session_state.user.get("provider", "anthropic")))
        new_apiKey = st.text_input("API Key", value=st.session_state.user.get("apiKey", ""), type="password")
        new_model = st.text_input("Model ID", value=st.session_state.user.get("model", "") or PROVIDERS[new_provider]["defaultModel"])
        
        if st.button("Save Settings"):
            st.session_state.user["provider"] = new_provider
            st.session_state.user["apiKey"] = new_apiKey
            st.session_state.user["model"] = new_model
            st.session_state.users[st.session_state.user["email"]] = st.session_state.user
            save_json(USERS_FILE, st.session_state.users)
            st.success("Settings saved!")

    # --- 🛡️ Admin ---
    elif tab == "admin" and st.session_state.user["role"] == "admin":
        st.header("Admin Dashboard")
        
        st.subheader("System Logs")
        st.dataframe(pd.DataFrame(st.session_state.logs).sort_index(ascending=False))
        
        st.subheader("User Management")
        st.write(st.session_state.users)
