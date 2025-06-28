#!/bin/bash

# 백엔드 서버 실행 스크립트
cd "$(dirname "$0")"

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt || {
    echo "Warning: Some dependencies failed to install. Trying individual installation..."
    pip install fastapi uvicorn "pydantic[email]" python-jose PyJWT passlib python-multipart sqlalchemy email-validator
}

echo "Starting backend server..."
python3 main.py
