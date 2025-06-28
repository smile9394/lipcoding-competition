#!/bin/bash

# 멘토-멘티 매칭 앱 실행 스크립트
echo "🚀 멘토-멘티 매칭 앱을 시작합니다..."

# 현재 디렉토리를 프로젝트 루트로 설정
cd "$(dirname "$0")"

# 포트 정리
echo "📱 기존 프로세스 정리 중..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# 백엔드 실행
echo "🔧 백엔드 서버 시작 중..."
cd backend

# Python 의존성 설치
echo "  - Python 의존성 설치 중..."
pip install --upgrade pip >/dev/null 2>&1
pip install -r requirements.txt >/dev/null 2>&1 || {
    echo "  - 의존성 설치 실패, 개별 설치 시도 중..."
    pip install fastapi uvicorn "pydantic[email]" python-jose PyJWT passlib python-multipart sqlalchemy email-validator pillow >/dev/null 2>&1
}

# 백엔드 서버 시작
echo "  - 백엔드 서버 실행 중... (포트: 8080)"
nohup python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!

# 백엔드 시작 대기
sleep 5

# 백엔드 상태 확인
if curl -s http://localhost:8080/ >/dev/null 2>&1; then
    echo "  ✅ 백엔드 서버 실행 성공!"
else
    echo "  ❌ 백엔드 서버 실행 실패!"
    exit 1
fi

cd ..

# 프론트엔드 실행
echo "🎨 프론트엔드 서버 시작 중..."
cd frontend

# Node.js 의존성 설치
echo "  - Node.js 의존성 설치 중..."
npm install >/dev/null 2>&1

# 프론트엔드 서버 시작
echo "  - 프론트엔드 서버 실행 중... (포트: 3000)"
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# 프론트엔드 시작 대기
sleep 10

# 프론트엔드 상태 확인
if curl -s http://localhost:3000/ >/dev/null 2>&1; then
    echo "  ✅ 프론트엔드 서버 실행 성공!"
else
    echo "  ⚠️  프론트엔드 서버 확인 필요 (시작 중일 수 있습니다)"
fi

cd ..

echo ""
echo "🎉 앱 실행 완료!"
echo ""
echo "📋 접속 정보:"
echo "  프론트엔드: http://localhost:3000"
echo "  백엔드 API: http://localhost:8080"
echo "  Swagger UI: http://localhost:8080/docs"
echo ""
echo "📝 로그 파일:"
echo "  백엔드: backend.log"
echo "  프론트엔드: frontend.log"
echo ""
echo "🛑 서버 종료 방법:"
echo "  pkill -f 'python3 main.py'"
echo "  pkill -f 'npm start'"
echo ""
echo "백엔드 PID: $BACKEND_PID"
echo "프론트엔드 PID: $FRONTEND_PID"
