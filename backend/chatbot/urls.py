from django.urls import path
from .views import ChatbotCreateView, ChatbotListView, ChatbotWebhookView, ChatbotIngestView

urlpatterns = [
    path("", ChatbotListView.as_view(), name="chatbot-list"),
    path("create/", ChatbotCreateView.as_view(), name="chatbot-create"),
    path("webhook/<str:webhook_key>/", ChatbotWebhookView.as_view(), name="chatbot-webhook"),
    path("<int:chatbot_id>/ingest/", ChatbotIngestView.as_view(), name="chatbot-ingest"),
]
