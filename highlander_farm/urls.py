# highlander_farm/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# === NOWE IMPORTY ===
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Główne API aplikacji (chronione)
    path('api/', include('cows.urls')),
    
    # === NOWE ENDPOINTY LOGOWANIA ===
    # Frontend wyśle POST na ten adres z 'username' i 'password'
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Frontend wyśle POST z 'refresh_token' aby dostać nowy 'access_token'
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
