# cows/serializers.py

from rest_framework import serializers
from .models import Cow, Event 

class CowSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField() 

    class Meta:
        model = Cow
        fields = ['id', 'tag_id', 'name', 'breed', 'birth_date', 'gender', 'photo', 'age', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'age']

    def get_age(self, obj):
        from datetime import date
        today = date.today()
        age = today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        return age

    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

class CowCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cow
        fields = ['id', 'tag_id', 'name', 'breed', 'birth_date', 'gender', 'photo']
        extra_kwargs = {
            'photo': {'required': False, 'allow_null': True, 'read_only': True} 
        }

    def validate_tag_id(self, value):
        instance = getattr(self, 'instance', None)
        if instance and instance.tag_id == value:
            return value
        if Cow.objects.filter(tag_id=value).exists():
            raise serializers.ValidationError(f"Krowa z tag_id '{value}' już istnieje")
        return value
        
    def validate_birth_date(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Data urodzenia nie może być w przyszłości")
        return value

class CowListSerializer(serializers.ModelSerializer): 
    age = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Cow
        fields = ['id', 'tag_id', 'name', 'breed', 'birth_date', 'gender', 'photo', 'age'] 

    def get_age(self, obj):
        from datetime import date
        today = date.today()
        age = today.year - obj.birth_date.year - ((today.month, today.day) < (obj.birth_date.month, obj.birth_date.day))
        return age
    
    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

# === ZMIANA W EVENT SERIALIZER ===
class EventSerializer(serializers.ModelSerializer):
    """Serializer dla zdarzeń"""
    
    # Zmieniamy na ReadOnlyField, będzie pobierane z requestu
    user = serializers.StringRelatedField(read_only=True)
    
    cow = serializers.PrimaryKeyRelatedField(queryset=Cow.objects.all())

    class Meta:
        model = Event
        fields = ['id', 'cow', 'event_type', 'date', 'notes', 'user', 'created_at']
        # 'user' jest teraz read_only, bo ustawiamy go w logice
        read_only_fields = ['user', 'created_at'] 

    def create(self, validated_data):
        # Pobierz użytkownika z kontekstu requestu
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Automatycznie przypisz zalogowanego użytkownika
            validated_data['user'] = request.user
        
        return super().create(validated_data)
