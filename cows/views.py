# cows/views.py

from rest_framework import viewsets, status, filters, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cow, Event 
from .serializers import (
    CowSerializer, 
    CowCreateUpdateSerializer, 
    CowListSerializer,
    EventSerializer 
)
from django.db import transaction, IntegrityError
import logging

# === NOWY IMPORT UPRAWNIEŃ ===
from rest_framework.permissions import IsAuthenticated, AllowAny

logger = logging.getLogger(__name__)

# === WIDOK SYNCHRONIZACJI (ZABEZPIECZONY) ===
class SyncView(views.APIView):
    parser_classes = [JSONParser]
    # Wymagaj zalogowania do synchronizacji
    permission_classes = [IsAuthenticated] 

    def post(self, request, *args, **kwargs):
        jobs = request.data.get('jobs', [])
        results = []
        temp_id_map = {} 

        try:
            with transaction.atomic():
                for job in jobs:
                    action = job.get('action')
                    payload = job.get('payload', {})
                    temp_id = job.get('tempId')
                    entity_id = job.get('entityId')
                    queue_id = job.get('id') 

                    job_result = {
                        "queueId": queue_id, 
                        "tempId": temp_id,
                        "entityId": entity_id,
                        "action": action,
                        "status": "pending"
                    }

                    try:
                        if action == 'createCow':
                            payload.pop('id', None) 
                            serializer = CowCreateUpdateSerializer(data=payload)
                            if serializer.is_valid(raise_exception=True):
                                new_cow = serializer.save()
                                temp_id_map[temp_id] = new_cow.id
                                job_result.update(status="ok", realId=new_cow.id)
                        
                        elif action == 'updateCow':
                            real_id = temp_id_map.get(entity_id, entity_id) 
                            if real_id < 0:
                                job_result.update(status="merged", realId=real_id) 
                            else:
                                cow = Cow.objects.get(id=real_id)
                                serializer = CowCreateUpdateSerializer(cow, data=payload, partial=True)
                                if serializer.is_valid(raise_exception=True):
                                    serializer.save()
                                    job_result.update(status="ok", realId=real_id)
                        
                        elif action == 'deleteCow':
                            real_id = temp_id_map.get(entity_id, entity_id)
                            if real_id > 0: 
                                Cow.objects.get(id=real_id).delete()
                            job_result.update(status="ok", realId=real_id)
                        
                        elif action == 'createEvent':
                            payload.pop('id', None)
                            cow_id = payload.get('cow')
                            if cow_id in temp_id_map:
                                payload['cow'] = temp_id_map[cow_id]
                            
                            # Przekaż kontekst (z request.user) do serializera
                            serializer = EventSerializer(data=payload, context={'request': request})
                            if serializer.is_valid(raise_exception=True):
                                # Serializer sam przypisze usera z requestu
                                new_event = serializer.save() 
                                temp_id_map[temp_id] = new_event.id
                                job_result.update(status="ok", realId=new_event.id)
                        
                        else:
                            raise Exception(f"Nieznana akcja: {action}")
                            
                    except IntegrityError as e: 
                        logger.warning(f"Błąd walidacji (np. unique) {job}: {str(e)}")
                        job_result.update(status="error", error=f"Błąd walidacji: {str(e)}")
                    except Cow.DoesNotExist as e: 
                        logger.warning(f"Nie znaleziono obiektu {job}: {str(e)}")
                        job_result.update(status="error", error=str(e))
                    except Exception as e:
                        logger.error(f"Błąd przetwarzania zadania {job}: {str(e)}")
                        job_result.update(status="error", error=str(e))
                    
                    results.append(job_result)

            return Response({"status": "ok", "results": results}, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Krytyczny błąd transakcji synchronizacji: {str(e)}")
            return Response(
                {"status": "error", "message": f"Transakcja nie powiodła się: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# === CowViewSet (ZABEZPIECZONY) ===

class CowViewSet(viewsets.ModelViewSet):
    queryset = Cow.objects.all()
    
    # Użyj domyślnych uprawnień (IsAuthenticated) z settings.py
    permission_classes = [IsAuthenticated] 
    
    pagination_class = None 
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'breed']
    search_fields = ['name', 'tag_id', 'breed']
    ordering_fields = ['created_at', 'birth_date', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CowCreateUpdateSerializer
        if self.action == 'list': 
            return CowListSerializer
        return CowSerializer 
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save() 
        headers = self.get_success_headers(serializer.data)
        response_serializer = CowSerializer(instance, context=self.get_serializer_context()) 
        return Response(
            response_serializer.data, 
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    # ... (Update, Partial_Update, Destroy bez zmian) ...
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_serializer = CowSerializer(instance, context=self.get_serializer_context())
        return Response(response_serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        cow_name = instance.name
        self.perform_destroy(instance)
        return Response(
            {'message': f'Krowa "{cow_name}" została usunięta'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        tag_id = request.query_params.get('tag_id', None)
        if not tag_id:
            return Response(
                {'error': 'Brak parametru tag_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            cow = Cow.objects.get(tag_id=tag_id)
            serializer = CowSerializer(cow, context=self.get_serializer_context()) 
            return Response(serializer.data)
        except Cow.DoesNotExist:
            return Response(
                {'error': f'Krowa z tag_id "{tag_id}" nie została znaleziona'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Count
        from datetime import date
        total = Cow.objects.count()
        by_gender = Cow.objects.values('gender').annotate(count=Count('id'))
        by_breed = Cow.objects.values('breed').annotate(count=Count('id'))
        cows = Cow.objects.all()
        # ... (reszta kodu stats bez zmian) ...
        if cows.exists():
            ages = []
            today = date.today()
            for cow in cows:
                age = today.year - cow.birth_date.year - (
                    (today.month, today.day) < (cow.birth_date.month, cow.birth_date.day)
                )
                ages.append(age)
            avg_age = sum(ages) / len(ages) if ages else 0
        else:
            avg_age = 0
        return Response({
            'total': total,
            'by_gender': list(by_gender),
            'by_breed': list(by_breed),
            'average_age': round(avg_age, 1)
        })
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        cow = self.get_object()
        # ... (reszta kodu upload_photo bez zmian) ...
        if 'photo' not in request.FILES:
            return Response(
                {'error': 'Brak pliku photo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if cow.photo:
            cow.photo.delete(save=False)
        cow.photo = request.FILES['photo']
        cow.save()
        serializer = CowSerializer(cow, context=self.get_serializer_context())
        return Response(serializer.data)

# === EventViewSet (ZABEZPIECZONY) ===
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    # Użyj domyślnych uprawnień (IsAuthenticated)
    permission_classes = [IsAuthenticated] 
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['cow'] 
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']
    
    # Przekaż kontekst (z request.user) do serializera
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context
