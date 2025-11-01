from django.db import models


class Cow(models.Model):
    GENDER_CHOICES = [
        ('M', 'Samiec'),
        ('F', 'Samica'),
    ]

    tag_id = models.CharField(max_length=50, unique=True, verbose_name="Numer kolczyka")
    name = models.CharField(max_length=100, verbose_name="Imię")
    breed = models.CharField(max_length=100, default="Highland Cattle", verbose_name="Rasa")
    birth_date = models.DateField(verbose_name="Data urodzenia")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='F', verbose_name="Płeć")
    photo = models.ImageField(upload_to='cows/', blank=True, null=True, verbose_name="Zdjęcie")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Krowa"
        verbose_name_plural = "Krowy"

    def __str__(self):
        return f"{self.tag_id} - {self.name}"