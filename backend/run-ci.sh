#!/bin/bash

# GitHub Actions용 백엔드 서버 실행 스크립트
cd "$(dirname "$0")"

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt || {
    echo "Warning: Some dependencies failed to install. Trying individual installation..."
    pip install fastapi uvicorn "pydantic[email]" python-jose PyJWT passlib python-multipart sqlalchemy email-validator
}

echo "Starting backend server..."
# GitHub Actions 환경에서는 백그라운드 실행
if [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "Running in GitHub Actions environment"
    python3 main.py &
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
    
    # Wait for server to start
    sleep 5
    
    # Keep the process running
    wait $SERVER_PID
else
    echo "Running in local environment"
    nohup python3 main.py > server.log 2>&1 &
    echo "Backend server started with PID: $!"
    echo "Server logs are written to server.log"
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is running
    if curl -s http://localhost:8080/docs > /dev/null; then
        echo "✅ Backend server is running successfully at http://localhost:8080"
    else
        echo "❌ Backend server failed to start. Check server.log for details."
    fi
fi
