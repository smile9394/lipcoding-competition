#!/bin/bash

# 백엔드 서버 실행 스크립트
cd "$(dirname "$0")"

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Starting backend server..."
python3 main.py
