from django.db import models
from django.utils import timezone
from chatbot.models import Chatbot
import datetime

class ChatMemory(models.Model):
    chatbot = models.ForeignKey(Chatbot, on_delete=models.CASCADE, related_name="memories")
    fb_user_id = models.CharField(max_length=200, db_index=True)
    messages = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("chatbot", "fb_user_id")

    def add_message(self, role: str, text: str):
        entry = {"role": role, "text": text, "time": timezone.now().isoformat()}
        current = list(self.messages or [])
        current.append(entry)
        self.messages = current[-6:]
        self.save(update_fields=["messages", "updated_at"])

    def is_expired(self, days_limit: int = 3) -> bool:
        return (timezone.now() - self.updated_at) > datetime.timedelta(days=days_limit)

    def clear(self):
        self.messages = []
        self.save(update_fields=["messages", "updated_at"])
