from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from tenants.views import UserRegistrationView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", UserRegistrationView.as_view(), name="user-register"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/tenants/", include("tenants.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/fb/", include("fb.urls")),
    path("api/chat/", include("chat.urls")),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
