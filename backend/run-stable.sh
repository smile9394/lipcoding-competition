#!/bin/bash

# 더 안정적인 백엔드 서버 실행 스크립트
cd "$(dirname "$0")"

# 환경 변수 설정
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export HOST=${HOST:-"0.0.0.0"}
export PORT=${PORT:-8080}

echo "Installing Python dependencies..."
pip install --upgrade pip setuptools wheel

# 의존성 설치 시 더 안정적인 방법 사용
pip install -r requirements.txt || {
    echo "Warning: requirements.txt installation failed. Installing packages individually..."
    pip install fastapi>=0.104.1
    pip install "uvicorn[standard]>=0.24.0"
    pip install "pydantic[email]>=2.5.0"
    pip install "python-jose[cryptography]>=3.3.0"
    pip install "PyJWT>=2.8.0"
    pip install "passlib[bcrypt]>=1.7.4"
    pip install python-multipart>=0.0.6
    pip install sqlalchemy>=2.0.23
    pip install pillow>=10.0.0 || echo "Warning: Pillow installation failed, continuing without it"
    pip install email-validator>=2.0.0
}

echo "Python packages installed:"
pip list | grep -E "(fastapi|uvicorn|pydantic|jose|jwt|passlib|multipart|sqlalchemy|pillow|email)"

echo "Starting backend server..."

# GitHub Actions 환경 감지
if [ "$GITHUB_ACTIONS" = "true" ] || [ "$CI" = "true" ]; then
    echo "Running in CI environment"
    # CI 환경에서는 타임아웃과 함께 실행
    timeout 30s python3 main.py || {
        echo "Server failed to start within 30 seconds"
        exit 1
    }
else
    echo "Running in local environment"
    # 로컬에서는 백그라운드 실행
    nohup python3 main.py > server.log 2>&1 &
    SERVER_PID=$!
    echo "Backend server started with PID: $SERVER_PID"
    echo "Server logs are written to server.log"
    
    # 서버 시작 대기
    sleep 5
    
    # 서버 상태 확인
    if curl -s http://localhost:${PORT}/docs > /dev/null 2>&1; then
        echo "✅ Backend server is running successfully at http://localhost:${PORT}"
        echo "✅ API documentation: http://localhost:${PORT}/docs"
        echo "✅ OpenAPI spec: http://localhost:${PORT}/openapi.json"
    else
        echo "❌ Backend server failed to start. Check server.log for details."
        cat server.log 2>/dev/null || echo "No server log available"
        exit 1
    fi
fi
