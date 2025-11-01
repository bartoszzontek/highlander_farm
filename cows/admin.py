from django.contrib import admin
from .models import Cow

@admin.register(Cow)
class CowAdmin(admin.ModelAdmin):
    list_display = ['tag_id', 'name', 'breed', 'birth_date', 'gender', 'created_at']
    list_filter = ['breed', 'gender', 'birth_date']
    search_fields = ['tag_id', 'name']
    ordering = ['-created_at']