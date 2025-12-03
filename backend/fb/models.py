from django.db import models
from tenants.models import Tenant
from cryptography.fernet import Fernet
from django.conf import settings

class FacebookPage(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="fb_pages")
    page_id = models.CharField(max_length=100)
    page_name = models.CharField(max_length=200, null=True, blank=True)
    access_token_encrypted = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def set_access_token(self, token: str):
        f = Fernet(settings.FERNET_KEY.encode())
        self.access_token_encrypted = f.encrypt(token.encode()).decode()

    def get_access_token(self):
        f = Fernet(settings.FERNET_KEY.encode())
        return f.decrypt(self.access_token_encrypted.encode()).decode()
