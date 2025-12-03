from django.urls import path
from .views import FacebookWebhookView

urlpatterns = [
    path("webhook/<str:webhook_key>/", FacebookWebhookView.as_view(), name="fb-webhook"),
]
