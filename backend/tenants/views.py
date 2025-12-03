from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Tenant
from .serializers import TenantSerializer, UserRegistrationSerializer

class UserRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create tenant for the new user
            tenant = Tenant.objects.create(
                name=f"{user.username}'s Workspace",
                owner=user
            )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'tenant': TenantSerializer(tenant).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TenantDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        t = Tenant.objects.filter(owner=request.user).first()
        if not t:
            # auto create a tenant for this user
            t = Tenant.objects.create(name=f"{request.user.username}'s Workspace", owner=request.user)
        return Response(TenantSerializer(t).data)
