from rest_framework import serializers
from .models import Chatbot
from tenants.models import Tenant

class ChatbotCreateSerializer(serializers.ModelSerializer):
    ingestion_status = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Chatbot
        fields = ("id","name","system_prompt","ingestion_status")

    def save(self, **kwargs):
        # Extract tenant from kwargs (passed from view's perform_create)
        tenant = kwargs.pop('tenant', None)
        if not tenant:
            # Fallback: get tenant from context if not provided
            tenant = Tenant.objects.filter(owner=self.context["request"].user).first()
            if not tenant:
                tenant = Tenant.objects.create(
                    name=f"{self.context['request'].user.username}'s Workspace",
                    owner=self.context["request"].user
                )
        # Store tenant to use in create method
        self._tenant = tenant
        return super().save(**kwargs)

    def create(self, validated_data):
        # Remove tenant from validated_data if it somehow got in there
        validated_data.pop('tenant', None)
        # Use the tenant stored in save()
        bot = Chatbot.objects.create(tenant=self._tenant, **validated_data)
        return bot
    
    def get_ingestion_status(self, obj):
        # Return ingestion result if available
        if hasattr(obj, '_ingestion_result'):
            return obj._ingestion_result
        return None

class ChatbotListSerializer(serializers.ModelSerializer):
    webhook_url = serializers.SerializerMethodField()
    widget_snippet = serializers.SerializerMethodField()
    class Meta:
        model = Chatbot
        fields = ("id","name","webhook_url","webhook_key","widget_snippet","created_at")

    def get_webhook_url(self, obj):
        req = self.context["request"]
        return f"{req.scheme}://{req.get_host()}/api/chatbot/webhook/{obj.webhook_key}/"

    def get_widget_snippet(self, obj):
        req = self.context["request"]
        host = f"{req.scheme}://{req.get_host()}"
        api_url = f"{host}/api"
        # Escape single quotes and newlines in chatbot name for JavaScript
        chatbot_name = obj.name.replace("'", "\\'").replace("\n", " ").replace("\r", "")
        snippet = f"""<!-- Chatbot Widget - {obj.name} -->
<script src="{host}/static/chatbot-widget.js"></script>
<script>
  ChatbotWidget.init({{
    webhookKey: '{obj.webhook_key}',
    apiBaseUrl: '{api_url}',
    primaryColor: '#2563eb',
    textColor: '#ffffff',
    buttonText: 'Chat',
    placeholder: 'Type your message...',
    title: '{chatbot_name}'
  }});
</script>"""
        return snippet
