from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import FacebookPage
from chatbot.models import Chatbot
from .services import process_incoming_for_chatbot
from tenants.models import Tenant

class FacebookWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, webhook_key=None):
        # FB webhook verification (if used). For unified webhook, ignore webhook_key in verify step.
        token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")
        if token == settings.FB_VERIFY_TOKEN:
            return Response(challenge)
        return Response("Invalid verify token", status=status.HTTP_403_FORBIDDEN)

    def post(self, request, webhook_key):
        body = request.data

        # There are two modes: webhook_key points to a Chatbot OR a FacebookPage
        # Prefer Chatbot (our widget or chatbots endpoint), else try FB Page (if you used per-page mapping)
        # Try to resolve a Chatbot first
        try:
            chatbot = Chatbot.objects.get(webhook_key=webhook_key, is_active=True)
        except Chatbot.DoesNotExist:
            chatbot = None

        fb_page = None
        # If Chatbot not found, try to find FacebookPage by matching webhook_key field (if you attach)
        if chatbot is None:
            try:
                fb_page = FacebookPage.objects.get(page_id=webhook_key)  # optional alternative mapping
            except FacebookPage.DoesNotExist:
                fb_page = None

        # If Chatbot exists and incoming is FB structure, map sender and proceed
        # Facebook sends payloads with "entry" -> "messaging"
        for entry in body.get("entry", []):
            for messaging in entry.get("messaging", []):
                if "message" not in messaging:
                    continue
                sender_id = messaging["sender"]["id"]
                text = messaging["message"].get("text", "")
                # If we have a mapping from FB page id to a Chatbot, you may map by page id
                # Determine responsible Chatbot:
                target_chatbot = chatbot
                # if chatbot is None, attempt to find by facebook page id -> then map to that page's default chatbot
                if target_chatbot is None:
                    page_id = messaging["recipient"].get("id")
                    # find FacebookPage record with page_id and tenant then pick default chatbot (if any)
                    try:
                        page = FacebookPage.objects.filter(page_id=page_id).first()
                        fb_page = page
                        # assume tenant has a default chatbot; pick latest for now
                        if page:
                            target_chatbot = page.tenant.chatbots.order_by("-created_at").first()
                    except Exception:
                        target_chatbot = None

                if target_chatbot:
                    # process and send reply
                    process_incoming_for_chatbot(target_chatbot, sender_id, text, channel="fb", fb_page=fb_page)

        return Response({"status":"ok"}, status=status.HTTP_200_OK)
