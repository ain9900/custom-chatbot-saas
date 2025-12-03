from django.contrib import admin
from .models import FacebookPage

@admin.register(FacebookPage)
class FacebookPageAdmin(admin.ModelAdmin):
    list_display = ("tenant","page_id","page_name","created_at")
    readonly_fields = ("access_token_encrypted",)
