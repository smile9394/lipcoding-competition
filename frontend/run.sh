#!/bin/bash

# 프론트엔드 서버 실행 스크립트
cd "$(dirname "$0")"

echo "Installing Node.js dependencies..."
npm install

echo "Starting frontend development server..."
npm start
