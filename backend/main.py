import os
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, APIRouter, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from passlib.context import CryptContext
import base64
import binascii
import html
import re
import json
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("Warning: Pillow not available. Image processing will be limited.")
import io
import uuid

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./mentor_mentee.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String)  # "mentor" or "mentee"
    bio = Column(Text)
    profile_image = Column(Text)  # Base64 encoded image
    skills = Column(Text)  # JSON string for mentor skills
    created_at = Column(DateTime, default=datetime.utcnow)

class MatchRequest(Base):
    __tablename__ = "match_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"))
    mentee_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    status = Column(String, default="pending")  # "pending", "accepted", "rejected", "cancelled"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    mentor = relationship("User", foreign_keys=[mentor_id])
    mentee = relationship("User", foreign_keys=[mentee_id])

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(mentor|mentee)$")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class LoginResponse(BaseModel):
    token: str

class ProfileDetails(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    bio: str = Field(default="", max_length=1000)
    imageUrl: str
    skills: Optional[List[str]] = None

class UserProfile(BaseModel):
    id: int
    email: str
    role: str
    profile: ProfileDetails

class UpdateProfileRequest(BaseModel):
    id: int
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(mentor|mentee)$")
    bio: str = Field(default="", max_length=1000)
    image: str = Field(default="")
    skills: Optional[List[str]] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class MatchRequestCreate(BaseModel):
    mentorId: int = Field(..., gt=0)
    menteeId: int = Field(..., gt=0)
    message: str = Field(..., min_length=1, max_length=500)
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

class MatchRequestResponse(BaseModel):
    id: int
    mentorId: int
    menteeId: int
    message: str
    status: str

class MatchRequestOutgoing(BaseModel):
    id: int
    mentorId: int
    menteeId: int
    status: str

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None

# FastAPI app
app = FastAPI(
    title="Mentor-Mentee Matching API",
    description="API for matching mentors and mentees in a mentoring platform",
    version="1.0.0"
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=400,
        content={"detail": "Validation error"}
    )

# Create API router
api_router = APIRouter()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Add required JWT claims
    to_encode.update({
        "iss": "mentor-mentee-app",
        "sub": str(data.get("user_id")),
        "aud": "mentor-mentee-users",
        "exp": expire,
        "nbf": datetime.utcnow(),
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4()),
        "name": data.get("name"),
        "email": data.get("email"),
        "role": data.get("role")
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            audience="mentor-mentee-users",
            issuer="mentor-mentee-app"
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.id == int(token_data.get("sub"))).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Security helper functions
def sanitize_input(text: str) -> str:
    """Sanitize input to prevent XSS attacks"""
    if not isinstance(text, str):
        return str(text)
    
    # Remove HTML tags and escape special characters
    cleaned = html.escape(text.strip())
    
    # Remove potentially dangerous characters
    cleaned = re.sub(r'[<>"\']', '', cleaned)
    
    return cleaned

def validate_user_input(text: str, max_length: int = 1000) -> str:
    """Validate and sanitize user input"""
    if not text:
        return ""
    
    if len(text) > max_length:
        raise HTTPException(status_code=400, detail=f"Input too long (max {max_length} characters)")
    
    return sanitize_input(text)

# Routes
@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

@api_router.post("/signup", status_code=201)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = get_password_hash(request.password)
        new_user = User(
            email=request.email,
            hashed_password=hashed_password,
            name=request.name,
            role=request.role,
            bio="",
            skills="[]" if request.role == "mentor" else None
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"message": "User created successfully"}
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        },
        expires_delta=access_token_expires
    )
    
    return LoginResponse(token=access_token)

@api_router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    skills = None
    if current_user.role == "mentor" and current_user.skills:
        try:
            skills = json.loads(current_user.skills)
        except (json.JSONDecodeError, TypeError):
            skills = []
    
    profile = ProfileDetails(
        name=current_user.name or "",
        bio=current_user.bio or "",
        imageUrl=f"/api/images/{current_user.role}/{current_user.id}",
        skills=skills
    )
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        profile=profile
    )

@api_router.put("/profile", response_model=UserProfile)
async def update_profile(request: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Validate image if provided
    if request.image:
        try:
            # Validate base64 format first
            if not request.image.startswith('data:image/'):
                # If not data URL, assume it's pure base64
                image_data = base64.b64decode(request.image, validate=True)
            else:
                # Extract base64 data from data URL
                if ',' in request.image:
                    image_data = base64.b64decode(request.image.split(',')[1], validate=True)
                else:
                    raise ValueError("Invalid data URL format")
            
            # Check file size first (before PIL processing)
            if len(image_data) > 1024 * 1024:  # 1MB
                raise HTTPException(status_code=400, detail="Image must be less than 1MB")
            
            if PIL_AVAILABLE:
                # Validate image with PIL
                image = Image.open(io.BytesIO(image_data))
                
                # Validate image format
                if image.format not in ['JPEG', 'PNG']:
                    raise HTTPException(status_code=400, detail="Image must be JPEG or PNG format")
                
                # Validate image dimensions
                width, height = image.size
                if width != height:
                    raise HTTPException(status_code=400, detail="Image must be square")
                
                if width < 500 or width > 1000:
                    raise HTTPException(status_code=400, detail="Image must be between 500x500 and 1000x1000 pixels")
                
                # Verify image can be processed
                image.verify()
            else:
                # Basic validation without PIL
                if len(image_data) < 100:  # Too small to be a valid image
                    raise HTTPException(status_code=400, detail="Invalid image data")
                
        except binascii.Error:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid image format")
    
    try:
        # Sanitize and validate user inputs
        safe_name = validate_user_input(request.name, 100)
        safe_bio = validate_user_input(request.bio, 1000)
        
        # Update user profile
        current_user.name = safe_name
        current_user.bio = safe_bio
        
        if request.image:
            current_user.profile_image = request.image
        
        # Handle skills for mentors
        if current_user.role == "mentor" and request.skills:
            # Sanitize each skill
            safe_skills = [validate_user_input(skill, 50) for skill in request.skills if skill.strip()]
            current_user.skills = json.dumps(safe_skills)
        
        db.commit()
        
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")
    
    # Return updated profile
    skills = None
    if current_user.role == "mentor" and current_user.skills:
        try:
            skills = json.loads(current_user.skills)
        except (json.JSONDecodeError, TypeError):
            skills = []
    
    profile = ProfileDetails(
        name=current_user.name,
        bio=current_user.bio,
        imageUrl=f"/api/images/{current_user.role}/{current_user.id}",
        skills=skills
    )
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        profile=profile
    )

@api_router.get("/images/{role}/{user_id}")
async def get_profile_image(role: str, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.profile_image:
        try:
            # Handle both data URL and plain base64
            if user.profile_image.startswith('data:image/'):
                if ',' in user.profile_image:
                    image_data = base64.b64decode(user.profile_image.split(',')[1])
                else:
                    raise ValueError("Invalid data URL format")
            else:
                image_data = base64.b64decode(user.profile_image)
            return Response(content=image_data, media_type="image/jpeg")
        except (binascii.Error, ValueError):
            pass
    
    # Return default placeholder image based on role
    default_url = f"https://placehold.co/500x500.jpg?text={role.upper()}"
    return RedirectResponse(url=default_url)

@api_router.get("/mentors", response_model=List[UserProfile])
async def get_mentors(skill: Optional[str] = None, orderBy: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can view mentor list")
    
    query = db.query(User).filter(User.role == "mentor")
    
    # Filter by skill if provided
    if skill:
        query = query.filter(User.skills.like(f'%"{skill}"%'))
    
    # Order by name or skill
    if orderBy == "name":
        query = query.order_by(User.name)
    elif orderBy == "skill":
        query = query.order_by(User.skills)
    else:
        query = query.order_by(User.id)
    
    mentors = query.all()
    
    result = []
    for mentor in mentors:
        skills = []
        if mentor.skills:
            try:
                skills = json.loads(mentor.skills)
            except (json.JSONDecodeError, TypeError):
                skills = []
        
        profile = ProfileDetails(
            name=mentor.name or "",
            bio=mentor.bio or "",
            imageUrl=f"/api/images/{mentor.role}/{mentor.id}",
            skills=skills
        )
        
        result.append(UserProfile(
            id=mentor.id,
            email=mentor.email,
            role=mentor.role,
            profile=profile
        ))
    
    return result

@api_router.post("/match-requests", response_model=MatchRequestResponse)
async def create_match_request(request: MatchRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        if current_user.role != "mentee":
            raise HTTPException(status_code=403, detail="Only mentees can send match requests")
        
        # Validate mentor exists and is actually a mentor
        mentor = db.query(User).filter(User.id == request.mentorId, User.role == "mentor").first()
        if not mentor:
            raise HTTPException(status_code=400, detail="Mentor not found")
        
        # Prevent self-matching
        if request.mentorId == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot send request to yourself")
        
        # Check if mentee already has a pending request to this mentor
        existing_request = db.query(MatchRequest).filter(
            MatchRequest.mentee_id == current_user.id,
            MatchRequest.mentor_id == request.mentorId,
            MatchRequest.status.in_(["pending", "accepted"])
        ).first()
        if existing_request:
            if existing_request.status == "accepted":
                raise HTTPException(status_code=400, detail="You already have an accepted request with this mentor")
            else:
                raise HTTPException(status_code=400, detail="You already have a pending request to this mentor")
        
        # Check if mentee already has a pending request to any mentor
        any_pending_request = db.query(MatchRequest).filter(
            MatchRequest.mentee_id == current_user.id,
            MatchRequest.status == "pending"
        ).first()
        if any_pending_request:
            raise HTTPException(status_code=400, detail="You already have a pending request. Cancel it first to send a new one")
        
        # Check if mentor already has an accepted mentee
        mentor_accepted_request = db.query(MatchRequest).filter(
            MatchRequest.mentor_id == request.mentorId,
            MatchRequest.status == "accepted"
        ).first()
        if mentor_accepted_request:
            raise HTTPException(status_code=400, detail="This mentor already has an accepted mentee")
        
        # Sanitize message
        safe_message = validate_user_input(request.message, 500)
        
        # Create new match request
        new_request = MatchRequest(
            mentor_id=request.mentorId,
            mentee_id=current_user.id,
            message=safe_message,
            status="pending"
        )
        
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        return MatchRequestResponse(
            id=new_request.id,
            mentorId=new_request.mentor_id,
            menteeId=new_request.mentee_id,
            message=new_request.message,
            status=new_request.status
        )
        
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create match request")

@api_router.get("/match-requests/incoming", response_model=List[MatchRequestResponse])
async def get_incoming_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can view incoming requests")
    
    requests = db.query(MatchRequest).filter(MatchRequest.mentor_id == current_user.id).all()
    
    return [
        MatchRequestResponse(
            id=req.id,
            mentorId=req.mentor_id,
            menteeId=req.mentee_id,
            message=req.message,
            status=req.status
        )
        for req in requests
    ]

@api_router.get("/match-requests/outgoing", response_model=List[MatchRequestOutgoing])
async def get_outgoing_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can view outgoing requests")
    
    requests = db.query(MatchRequest).filter(MatchRequest.mentee_id == current_user.id).all()
    
    return [
        MatchRequestOutgoing(
            id=req.id,
            mentorId=req.mentor_id,
            menteeId=req.mentee_id,
            status=req.status
        )
        for req in requests
    ]

@api_router.put("/match-requests/{request_id}/accept", response_model=MatchRequestResponse)
async def accept_match_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can accept requests")
    
    try:
        request = db.query(MatchRequest).filter(
            MatchRequest.id == request_id,
            MatchRequest.mentor_id == current_user.id,
            MatchRequest.status == "pending"
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Match request not found or already processed")
        
        # Check if mentor already has an accepted request
        existing_accepted = db.query(MatchRequest).filter(
            MatchRequest.mentor_id == current_user.id,
            MatchRequest.status == "accepted"
        ).first()
        
        if existing_accepted:
            raise HTTPException(status_code=400, detail="You already have an accepted mentee")
        
        # Accept this request and reject all other pending requests for this mentor
        request.status = "accepted"
        
        # Reject other pending requests for this mentor
        other_requests = db.query(MatchRequest).filter(
            MatchRequest.mentor_id == current_user.id,
            MatchRequest.id != request_id,
            MatchRequest.status == "pending"
        ).all()
        
        for other_req in other_requests:
            other_req.status = "rejected"
        
        db.commit()
        
        return MatchRequestResponse(
            id=request.id,
            mentorId=request.mentor_id,
            menteeId=request.mentee_id,
            message=request.message,
            status=request.status
        )
        
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept match request")

@api_router.put("/match-requests/{request_id}/reject", response_model=MatchRequestResponse)
async def reject_match_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can reject requests")
    
    try:
        request = db.query(MatchRequest).filter(
            MatchRequest.id == request_id,
            MatchRequest.mentor_id == current_user.id,
            MatchRequest.status == "pending"
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Match request not found or already processed")
        
        request.status = "rejected"
        db.commit()
        
        return MatchRequestResponse(
            id=request.id,
            mentorId=request.mentor_id,
            menteeId=request.mentee_id,
            message=request.message,
            status=request.status
        )
        
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reject match request")

@api_router.delete("/match-requests/{request_id}", response_model=MatchRequestResponse)
async def cancel_match_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "mentee":
        raise HTTPException(status_code=403, detail="Only mentees can cancel requests")
    
    try:
        request = db.query(MatchRequest).filter(
            MatchRequest.id == request_id,
            MatchRequest.mentee_id == current_user.id
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Match request not found")
        
        if request.status == "cancelled":
            raise HTTPException(status_code=400, detail="Request already cancelled")
        
        request.status = "cancelled"
        db.commit()
        
        return MatchRequestResponse(
            id=request.id,
            mentorId=request.mentor_id,
            menteeId=request.mentee_id,
            message=request.message,
            status=request.status
        )
        
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to cancel match request")

# Include API router with /api prefix
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
