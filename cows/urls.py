# cows/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CowViewSet, EventViewSet, SyncView # Importuj SyncView

router = DefaultRouter()
router.register(r'cows', CowViewSet) 
router.register(r'events', EventViewSet) 

urlpatterns = [
    path('', include(router.urls)),
    
    # === NOWA ŚCIEŻKA ===
    # /api/sync/
    path('sync/', SyncView.as_view(), name='sync'),
]
