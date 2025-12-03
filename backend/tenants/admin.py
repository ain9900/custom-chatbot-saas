from django.contrib import admin
from .models import Tenant, Plan

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at", "is_active")

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("name", "messages_limit", "products_limit")
