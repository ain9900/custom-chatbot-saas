import uuid
from django.db import models
from tenants.models import Tenant

def gen_key():
    return uuid.uuid4().hex

def gen_vector_namespace():
    return "chatbot_" + uuid.uuid4().hex[:12]

class Chatbot(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="chatbots")
    name = models.CharField(max_length=200)
    webhook_key = models.CharField(max_length=64, unique=True, default=gen_key)
    webhook_secret = models.CharField(max_length=64, default=gen_key)
    vector_namespace = models.CharField(max_length=200, default=gen_vector_namespace)
    system_prompt = models.TextField(blank=True, default="You are a helpful assistant.")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.tenant})"
