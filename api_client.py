import requests
import json
import re

# --- Provider Definitions ---
PROVIDERS = {
    'anthropic': {
        'id': 'anthropic',
        'name': 'Anthropic',
        'logo': '🟣',
        'defaultModel': 'claude-3-5-sonnet-20240620',
        'endpoint': 'https://api.anthropic.com/v1/messages',
    },
    'openai': {
        'id': 'openai',
        'name': 'OpenAI',
        'logo': '🟢',
        'defaultModel': 'gpt-4o',
        'endpoint': 'https://api.openai.com/v1/chat/completions',
    },
    'groq': {
        'id': 'groq',
        'name': 'Groq',
        'logo': '⚡',
        'defaultModel': 'llama-3.3-70b-versatile',
        'endpoint': 'https://api.groq.com/openai/v1/chat/completions',
    },
    'gemini': {
        'id': 'gemini',
        'name': 'Google Gemini',
        'logo': '🔵',
        'defaultModel': 'gemini-2.0-flash',
        'endpoint': 'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key={apiKey}&alt=sse',
    },
    'mistral': {
        'id': 'mistral',
        'name': 'Mistral',
        'logo': '🌊',
        'defaultModel': 'mistral-large-latest',
        'endpoint': 'https://api.mistral.ai/v1/chat/completions',
    },
    'qwen': {
        'id': 'qwen',
        'name': 'Alibaba Qwen',
        'logo': '🔷',
        'defaultModel': 'qwen-max',
        'endpoint': 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    },
}

def call_ai(config, prompt):
    """
    Call the AI API for the given provider config.
    Returns the full response text.
    Note: Streamlit's st.write(stream) can handle generators, but for simplicity, 
    we'll return the full text or yield chunks if needed.
    """
    provider = config.get('provider', 'anthropic')
    api_key = config.get('apiKey')
    model = config.get('model') or PROVIDERS[provider]['defaultModel']
    
    if provider == 'anthropic':
        return call_anthropic(api_key, model, prompt)
    elif provider in ['openai', 'groq', 'mistral', 'qwen']:
        return call_openai_compat(provider, api_key, model, prompt)
    elif provider == 'gemini':
        return call_gemini(api_key, model, prompt)
    else:
        raise ValueError(f"Provider '{provider}' not supported.")

def call_anthropic(api_key, model, prompt):
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
    }
    data = {
        'model': model,
        'max_tokens': 4000,
        'messages': [{'role': 'user', 'content': prompt}]
    }
    response = requests.post(PROVIDERS['anthropic']['endpoint'], headers=headers, json=data)
    response.raise_for_status()
    return response.json()['content'][0]['text']

def call_openai_compat(provider, api_key, model, prompt):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }
    if provider == 'qwen':
        headers['X-DashScope-SSE'] = 'enable'
        
    data = {
        'model': model,
        'max_tokens': 4000,
        'messages': [{'role': 'user', 'content': prompt}]
    }
    response = requests.post(PROVIDERS[provider]['endpoint'], headers=headers, json=data)
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']

def call_gemini(api_key, model, prompt):
    url = PROVIDERS['gemini']['endpoint'].format(model=model, apiKey=api_key)
    data = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'maxOutputTokens': 4000}
    }
    # Gemini SSE streaming is a bit different, for non-streaming:
    url_non_stream = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    response = requests.post(url_non_stream, json=data)
    response.raise_for_status()
    return response.json()['candidates'][0]['content']['parts'][0]['text']

def parse_score(text):
    match = re.search(r'CANDIDATE_SCORE:(\{.*?\})', text)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            return None
    return None

def strip_meta(text):
    if not text: return ""
    text = re.sub(r'CANDIDATE_SCORE:\{.*?\}', '', text)
    text = re.sub(r'SCORE_DIMENSIONS:\{.*?\}', '', text)
    return text.strip()
