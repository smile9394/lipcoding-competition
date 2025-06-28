#!/usr/bin/env python3
"""
간단한 테스트용 FastAPI 서버
의존성 문제가 있을 때 사용할 수 있는 최소한의 서버
"""

try:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    import uvicorn
    
    app = FastAPI(
        title="Mentor-Mentee Matching API (Test Version)",
        description="Simplified version for testing",
        version="1.0.0-test"
    )
    
    @app.get("/")
    async def root():
        return {"message": "Mentor-Mentee Matching API is running", "status": "ok"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "version": "1.0.0-test"}
    
    @app.get("/api/health")
    async def api_health():
        return {"status": "healthy", "message": "API is working"}
    
    if __name__ == "__main__":
        print("Starting simplified test server...")
        uvicorn.run(app, host="0.0.0.0", port=8080)

except ImportError as e:
    print(f"Import error: {e}")
    print("Installing required packages...")
    import subprocess
    import sys
    
    # 기본 패키지만 설치
    packages = ["fastapi", "uvicorn"]
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except subprocess.CalledProcessError:
            print(f"Failed to install {package}")
    
    print("Please run the script again after package installation.")
    sys.exit(1)
    
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)
