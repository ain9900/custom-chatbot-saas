import os
from openai import OpenAI
from django.conf import settings

def ask_llm(messages: list, system_prompt: str = None, model: str = "gpt-4o-mini"):
    api_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY if hasattr(settings, "OPENAI_API_KEY") else None)
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")
    
    client = OpenAI(api_key=api_key)
    
    payload_messages = []
    if system_prompt:
        payload_messages.append({"role": "system", "content": system_prompt})
    for m in messages:
        # m expected {'role','content'}
        payload_messages.append({"role": m.get("role"), "content": m.get("content")})
    
    response = client.chat.completions.create(model=model, messages=payload_messages)
    return response.choices[0].message.content
