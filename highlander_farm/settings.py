# highlander_farm/settings.py

from pathlib import Path
import os
from datetime import timedelta

# Ścieżka bazowa projektu
BASE_DIR = Path(__file__).resolve().parent.parent

# KLUCZ TAJNY - W produkcji powinien być pobierany ze zmiennych środowiskowych
SECRET_KEY = 'django-insecure-your-secret-key-change-in-production'

# DEBUG ustawiony na False w produkcji
DEBUG = True

# Konfiguracja hostów - '*' rozwiązuje problem Bad Request (400) przy tunelach
ALLOWED_HOSTS = ['*']

# Zaufane źródła dla Cloudflare
CSRF_TRUSTED_ORIGINS = [
    'https://highlander.zipit.pl',
    'https://higlander.zipit.pl'
]

# Konfiguracja proxy - niezbędna do poprawnego działania za Nginksem/Cloudflare
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'django_filters',

    # Local apps
    'cows',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'highlander_farm.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'highlander_farm.wsgi.application'

# Baza danych - SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pl-pl'
TIME_ZONE = 'Europe/Warsaw'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Konfiguracja CORS
CORS_ALLOWED_ORIGINS = [
    "https://highlander.zipit.pl",
    "https://higlander.zipit.pl",
    "http://localhost:5173",  # Dodaj to dla Vite
    "http://127.0.0.1:5173", # Dodaj to dla Vite
]

CORS_ALLOW_CREDENTIALS = True

# === REST_FRAMEWORK ===
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# === SIMPLEJWT ===
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}