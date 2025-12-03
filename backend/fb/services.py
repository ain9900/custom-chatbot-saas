import requests
from django.conf import settings
from chat.models import ChatMemory
from chatbot.models import Chatbot
from .models import FacebookPage
from utils.llm_clients import ask_llm
from ingestion.vector_client import retrieve_top_k  # optional, if ingestion exists

def send_reply_to_facebook(page: FacebookPage, recipient_id: str, text: str):
    token = page.get_access_token()
    url = f"https://graph.facebook.com/v16.0/{page.page_id}/messages"
    payload = {"recipient":{"id": recipient_id}, "message":{"text": text}}
    params = {"access_token": token}
    try:
        requests.post(url, json=payload, params=params, timeout=10)
    except Exception:
        pass

def process_incoming_for_chatbot(chatbot: Chatbot, sender_id: str, text: str, channel: str = "fb", fb_page: FacebookPage = None):
    # Chat memory per chatbot + user
    mem, _ = ChatMemory.objects.get_or_create(chatbot=chatbot, fb_user_id=sender_id)
    if mem.is_expired():
        mem.clear()
    mem.add_message("user", text)

    # retrieval (optional)
    docs = []
    try:
        from ingestion.services import search_similar
        docs = search_similar(chatbot.vector_namespace, text, k=4)
    except Exception as e:
        print(f"Error retrieving vectors: {e}")
        docs = []

    # Build messages for LLM
    messages = [{"role":"system", "content": chatbot.system_prompt}]
    # add memory (last messages)
    for m in mem.messages[-6:]:
        messages.append({"role": m["role"], "content": m["text"]})
    # add docs
    for d in docs:
        messages.append({"role":"system","content":"Relevant: " + d})

    messages.append({"role":"user","content": text})
    reply = ask_llm(messages)

    mem.add_message("assistant", reply)

    # send to FB if FB channel
    if channel == "fb" and fb_page:
        send_reply_to_facebook(fb_page, sender_id, reply)
    # if widget, return reply
    return reply
