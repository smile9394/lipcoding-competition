# 멘토-멘티 매칭 앱

웹 기반 멘토-멘티 매칭 시스템입니다. 멘토는 자신의 기술 스택과 소개를 등록하고, 멘티는 원하는 멘토에게 매칭 요청을 보낼 수 있습니다.

## 🚀 기술 스택

### 백엔드
- Python 3.12
- FastAPI
- SQLite
- SQLAlchemy
- JWT 인증
- Pydantic

### 프론트엔드
- React.js
- TypeScript
- Axios
- React Router

## 📋 주요 기능

1. **회원가입/로그인**: JWT 기반 인증 시스템
2. **사용자 프로필**: 멘토/멘티별 맞춤 프로필 관리
3. **프로필 이미지**: Base64 인코딩으로 이미지 업로드
4. **멘토 검색**: 기술 스택별 검색 및 정렬
5. **매칭 요청**: 멘티→멘토 요청 시스템
6. **요청 관리**: 수락/거절/취소 기능

## 🛠️ 설치 및 실행

### 🚀 전체 앱 실행 (권장)

\`\`\`bash
# 루트 디렉토리에서 실행
./start.sh
\`\`\`

앱이 자동으로 시작됩니다:
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8080  
- Swagger UI: http://localhost:8080/docs

### 개별 실행

#### 백엔드 실행

\`\`\`bash
cd backend
pip install -r requirements.txt
python main.py
\`\`\`

백엔드 서버: http://localhost:8080
API 문서: http://localhost:8080/docs

#### 프론트엔드 실행

\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

프론트엔드 서버: http://localhost:3000

## 📚 API 엔드포인트

### 인증
- `POST /api/signup`: 회원가입
- `POST /api/login`: 로그인

### 사용자 프로필
- `GET /api/me`: 내 정보 조회
- `PUT /api/profile`: 프로필 수정
- `GET /api/images/{role}/{id}`: 프로필 이미지

### 멘토 관리
- `GET /api/mentors`: 멘토 목록 조회 (멘티 전용)

### 매칭 요청
- `POST /api/match-requests`: 매칭 요청 생성
- `GET /api/match-requests/incoming`: 받은 요청 목록 (멘토 전용)
- `GET /api/match-requests/outgoing`: 보낸 요청 목록 (멘티 전용)
- `PUT /api/match-requests/{id}/accept`: 요청 수락
- `PUT /api/match-requests/{id}/reject`: 요청 거절
- `DELETE /api/match-requests/{id}`: 요청 취소

## 🔐 JWT 토큰

RFC 7519 표준을 준수하여 다음 클레임을 포함합니다:
- `iss`: 발급자
- `sub`: 사용자 ID
- `aud`: 대상
- `exp`: 만료 시간 (1시간)
- `nbf`: 유효 시작 시간
- `iat`: 발급 시간
- `jti`: 토큰 ID
- `name`: 사용자 이름
- `email`: 이메일
- `role`: 역할 (mentor/mentee)

## 🖼️ 이미지 요구사항

- 형식: JPG, PNG
- 크기: 500x500 ~ 1000x1000 픽셀
- 용량: 최대 1MB
- 기본 이미지: 플레이스홀더 제공

## 🔒 보안 기능

- SQL 인젝션 방지
- XSS 공격 방지
- JWT 토큰 기반 인증
- 비밀번호 해시화 (bcrypt)
- CORS 설정

## 📝 테스트 ID

UI 테스트를 위한 HTML 요소 ID가 설정되어 있습니다:

### 회원가입/로그인
- 이메일: `#email`
- 비밀번호: `#password`
- 역할: `#role`
- 가입 버튼: `#signup`
- 로그인 버튼: `#login`

### 프로필
- 이름: `#name`
- 소개: `#bio`
- 기술스택: `#skillsets`
- 프로필 사진: `#profile-photo`
- 사진 업로드: `#profile`
- 저장 버튼: `#save`

### 멘토 목록
- 멘토 카드: `.mentor`
- 검색: `#search`
- 정렬 (이름): `#name`
- 정렬 (스킬): `#skill`

### 매칭 요청
- 메시지: `#message[data-mentor-id="{id}"]`
- 요청 상태: `#request-status`
- 요청 버튼: `#request`
- 수락 버튼: `#accept`
- 거절 버튼: `#reject`

## 📄 라이센스

MIT License
