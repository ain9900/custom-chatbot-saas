from django.contrib import admin
from .models import Chatbot

@admin.register(Chatbot)
class ChatbotAdmin(admin.ModelAdmin):
    list_display = ("name","tenant","created_at","is_active")
    readonly_fields = ("webhook_key","webhook_secret","vector_namespace")
