FROM python:3.11-slim

WORKDIR /app

# Instalacja zależności systemowych
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

# Skrypt startowy (migracje + gunicorn)
CMD python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    gunicorn highlander_farm.wsgi:application --bind 0.0.0.0:8000