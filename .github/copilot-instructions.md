# Copilot Instructions for Mentor-Mentee Matching App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a mentor-mentee matching web application with the following specifications:

### Technology Stack
- **Backend**: Python 3.12 + FastAPI
- **Frontend**: React.js + TypeScript
- **Database**: SQLite
- **Authentication**: JWT tokens
- **API Documentation**: OpenAPI/Swagger

### Key Requirements
1. Follow the OpenAPI specification provided in the competition requirements
2. Implement JWT authentication with all required claims (iss, sub, aud, exp, nbf, iat, jti, name, email, role)
3. Support mentor and mentee roles with different UI flows
4. Include profile image upload functionality with base64 encoding
5. Implement proper security measures (SQL injection, XSS protection)
6. Use specific HTML element IDs for testing purposes as specified in user stories

### API Endpoints
All API endpoints should be prefixed with `/api/` and follow the specification:
- Authentication: `/signup`, `/login`
- User Profile: `/me`, `/profile`, `/images/{role}/{id}`
- Mentors: `/mentors` (with filtering and sorting)
- Match Requests: `/match-requests/*` (CRUD operations)

### Development Guidelines
- Follow REST API best practices
- Implement proper error handling with standard HTTP status codes
- Use TypeScript for frontend type safety
- Follow React best practices with functional components and hooks
- Implement responsive design
- Add proper validation for all user inputs

### Running Instructions
- Backend should run on `http://localhost:8080`
- Frontend should run on `http://localhost:3000`
- Backend API base URL: `http://localhost:8080/api`
