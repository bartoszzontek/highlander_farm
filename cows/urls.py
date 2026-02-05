from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CowViewSet, EventViewSet, SyncView, UserViewSet,
    CowDocumentViewSet, TaskViewSet, HerdViewSet
)

# Rejestracja ViewSetów w routerze
router = DefaultRouter()
router.register(r'cows', CowViewSet, basename='cow')
router.register(r'events', EventViewSet, basename='event')
router.register(r'users', UserViewSet, basename='user')
router.register(r'documents', CowDocumentViewSet, basename='document')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'herds', HerdViewSet, basename='herd')

urlpatterns = [
    # Router automatycznie tworzy ścieżki (np. /cows/, /events/)
    path('', include(router.urls)),

    # Dodatkowe ścieżki niebędące ViewSetami
    path('sync/', SyncView.as_view(), name='sync'),
]