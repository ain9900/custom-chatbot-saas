from django.contrib import admin
from .models import ChatMemory

@admin.register(ChatMemory)
class ChatMemoryAdmin(admin.ModelAdmin):
    list_display = ("chatbot","fb_user_id","updated_at")
