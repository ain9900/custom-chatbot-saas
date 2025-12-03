from django.urls import path
from .views import TenantDetailView

urlpatterns = [
    path("me/", TenantDetailView.as_view(), name="tenant-me"),
]
