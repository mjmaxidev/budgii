FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY tests ./tests
COPY alembic ./alembic
COPY alembic.ini .
RUN chmod +x scripts/entrypoint.sh && mkdir -p /app/uploads

EXPOSE 8000

ENTRYPOINT ["./scripts/entrypoint.sh"]
