"""Task Manager Backend Application."""
import os
import time
import base64
import io
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr
import fastapi
from fastapi import HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError, ExpiredSignatureError
from pydantic import Field
from PIL import Image, ImageOps

# Import SQLAlchemy models and database session
from database import get_db, engine, Base
from models import User as UserModel, Task as TaskModel

# Create all tables on startup (if they don't exist)
# Wrapped in try-except so the app can still start if the database is unreachable
try:
    Base.metadata.create_all(bind=engine)
    print("[INFO] Database tables created/verified successfully")
except Exception as e:
    print(f"[WARNING] Could not create database tables: {e}")
    print("[WARNING] Signup/Login endpoints will fail until the database is reachable")

app = fastapi.FastAPI()

# Configure CORS — read from environment variable, fallback to localhost defaults
CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost")
print(f"[DEBUG] CORS_ORIGINS = {CORS_ORIGINS_ENV}")
CORS_ORIGINS_LIST = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configuration from environment variables
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "025hjoP8smSyb2o-98d5Y1CLt_N53rqo0gzr5dFY9xY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES","10"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Timezone configuration
IST_TIMEZONE = timezone(timedelta(hours=5, minutes=30))
UTC_TIMEZONE = timezone.utc


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


class User(BaseModel):
    firstName: str
    lastName: str | None = None
    email: EmailStr
    password: str
    dateOfBirth: str | None = None  # Store as ISO string "YYYY-MM-DD"
    profession: str | None = None
    bio: str | None = None
    location: str | None = None
    phone: str | None = None
    profilePicture: str | None = None  # Base64 encoded image
    delete_attempts: int = 0  # Track failed delete password attempts
    delete_lockout_until: datetime | None = None  # Lockout timestamp


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    dateOfBirth: str | None = None
    profession: str | None = None
    bio: str | None = None
    location: str | None = None
    phone: str | None = None
    profilePicture: str | None = None


class UserTask(BaseModel):
    title: str
    description: str
    todoList: list[str] | None = None
    id: int | None = None
    created_at: datetime | None = None
    modified_at: datetime | None = None


class UserTasksRequest(BaseModel):
    tasks: list[UserTask]


class DeleteErrorResponse(BaseModel):
    detail: str
    attempts_remaining: Optional[int] = None
    is_locked: Optional[bool] = None
    lockout_until: Optional[str] = None  # Store as ISO string for JSON serialization

    @classmethod
    def from_datetime(cls, detail: str, attempts_remaining: Optional[int] = None,
                     is_locked: Optional[bool] = None, lockout_until: Optional[datetime] = None):
        """Create DeleteErrorResponse with datetime converted to ISO string."""
        lockout_until_str = lockout_until.isoformat() if lockout_until else None
        return cls(
            detail=detail,
            attempts_remaining=attempts_remaining,
            is_locked=is_locked,
            lockout_until=lockout_until_str
        )


class DeleteAccountRequest(BaseModel):
    password: str
    confirmationText: str


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(authorization: str = fastapi.Header(..., alias="Authorization")):
    """Dependency that validates Authorization header and returns JWT payload."""
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        token = parts[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =============================================================================
# SIGNUP & LOGIN ENDPOINTS (MySQL via SQLAlchemy)
# =============================================================================


@app.post("/signup")
def signup(user: User, db: Session = Depends(get_db)):
    """Endpoint to handle user signup using MySQL database."""
    user_dict = user.model_dump()
    time.sleep(2)  # Simulate processing delay

    # Check if email already exists
    existing = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing:
        return {"error": HTTPException(400, "Error: A user with this email address already exists")}

    try:
        # Hash the password before storing it in the database
        # Truncate password to 72 bytes (bcrypt limit) before hashing
        user_dict["password"] = hash_password(user_dict["password"])
    except ValueError as e:
        return {"error": f"Invalid password: {str(e)}"}

    try:
        # Create new user record
        new_user = UserModel(
            firstName=user_dict.get("firstName", ""),
            lastName=user_dict.get("lastName"),
            email=user_dict.get("email", ""),
            password=user_dict.get("password", ""),
            dateOfBirth=user_dict.get("dateOfBirth"),
            profession=user_dict.get("profession"),
            bio=user_dict.get("bio"),
            location=user_dict.get("location"),
            phone=user_dict.get("phone"),
            profilePicture=user_dict.get("profilePicture"),
            delete_attempts=0,
            delete_lockout_until=None,
            created_at=datetime.now(UTC_TIMEZONE),
            modified_at=datetime.now(UTC_TIMEZONE),
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User added successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        return {"error": f"Error occurred while adding user to database: {str(e)}"}


@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Endpoint to handle user login using MySQL database."""
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if not user:
        raise HTTPException(400, "Invalid email or password")

    if not verify_password(request.password, user.password):
        raise HTTPException(400, "Invalid email or password")

    # Create access token (user_id is now an integer)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )

    # Return profile data for frontend Redux store
    return {
        "message": f"Login successful for user {user.firstName}",
        "user_id": user.id,
        "token": access_token,
        "firstName": user.firstName or "",
        "lastName": user.lastName or "",
        "email": user.email or "",
        "dateOfBirth": user.dateOfBirth or "",
        "profession": user.profession or "",
        "bio": user.bio or "",
        "location": user.location or "",
        "phone": user.phone or "",
        "profilePicture": user.profilePicture or "",
        "token_type": "bearer"
    }


# =============================================================================
# TASK ENDPOINTS (MySQL via SQLAlchemy)
# =============================================================================


@app.post("/users/{userId}/tasks")
def save_user_tasks(userId: int, tasks: UserTasksRequest, db: Session = Depends(get_db), payload: dict = fastapi.Depends(get_current_user)):
    """Save a user's tasks using SQLAlchemy/MySQL.

    For each incoming task:
    - If it has an `id`, update the existing task.
    - If it has no `id`, create a new task.
    """
    user_id = payload.get("user_id")
    # Verify that the authenticated user matches the path userId
    if str(user_id) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot save tasks for another user")

    # Use the parsed Pydantic list directly
    incoming = tasks.tasks or []

    if not incoming:
        return {"message": "No tasks provided"}

    now = datetime.now(UTC_TIMEZONE)
    inserted_ids = []
    updated_count = 0

    try:
        for t in incoming:
            if t.id:
                # Existing task: update it
                task = db.query(TaskModel).filter(
                    TaskModel.id == t.id,
                    TaskModel.user_id == int(userId)
                ).first()
                if not task:
                    raise HTTPException(status_code=404, detail=f"Task with id {t.id} not found")
                task.title = t.title
                task.description = t.description
                task.todo_list = json.dumps(t.todoList or [])
                task.modified_at = now
                updated_count += 1
            else:
                # New task: create it
                new_task = TaskModel(
                    user_id=int(userId),
                    title=t.title,
                    description=t.description,
                    todo_list=json.dumps(t.todoList or []),
                    created_at=now,
                    modified_at=now,
                )
                db.add(new_task)
                db.flush()  # Get the new task id without committing yet
                inserted_ids.append(new_task.id)

        db.commit()

        return {
            "message": f"Inserted {len(inserted_ids)} new task(s), updated {updated_count} task(s)",
            "inserted_ids": inserted_ids,
            "updated_count": updated_count,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving task: {str(e)}")


@app.get("/users/{userId}/tasks")
def get_user_tasks(userId: int, db: Session = Depends(get_db), payload: dict = fastapi.Depends(get_current_user)):
    """Fetch all tasks for a given user using SQLAlchemy/MySQL."""
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's tasks")

    try:
        tasks = (
            db.query(TaskModel)
            .filter(TaskModel.user_id == int(userId))
            .order_by(TaskModel.created_at.asc(), TaskModel.id.asc())
            .all()
        )

        result = []
        for t in tasks:
            result.append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "todoList": json.loads(t.todo_list) if t.todo_list else [],
                "created_at": t.created_at,
                "modified_at": t.modified_at,
            })

        return {"userId": userId, "tasks": result, "count": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")


@app.get("/users/{userId}/tasks/{taskId}")
def get_user_task(userId: int, taskId: int, db: Session = Depends(get_db), payload: dict = fastapi.Depends(get_current_user)):
    """Fetch a specific task for a user using SQLAlchemy/MySQL."""
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's tasks")

    try:
        task = db.query(TaskModel).filter(
            TaskModel.id == int(taskId),
            TaskModel.user_id == int(userId)
        ).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        return {
            "userId": userId,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "todoList": json.loads(task.todo_list) if task.todo_list else [],
                "created_at": task.created_at,
                "modified_at": task.modified_at,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching task: {str(e)}")


@app.post("/users/{userId}/tasks/{taskId}")
def update_user_task(
    userId: int,
    taskId: int,
    task_update: UserTask,
    db: Session = Depends(get_db),
    payload: dict = fastapi.Depends(get_current_user)
):
    """Update a specific task for a user using SQLAlchemy/MySQL."""
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's tasks")

    try:
        task = db.query(TaskModel).filter(
            TaskModel.id == int(taskId),
            TaskModel.user_id == int(userId)
        ).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        now = datetime.now(UTC_TIMEZONE)
        task.title = task_update.title
        task.description = task_update.description
        task.todo_list = json.dumps(task_update.todoList or [])
        task.modified_at = now

        db.commit()
        db.refresh(task)

        return {
            "message": "Task updated successfully",
            "taskId": taskId,
            "modified": True,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "todoList": json.loads(task.todo_list) if task.todo_list else [],
                "created_at": task.created_at,
                "modified_at": task.modified_at,
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")


@app.delete("/users/{userId}/tasks/{taskId}")
def delete_user_task(userId: int, taskId: int, db: Session = Depends(get_db), payload: dict = fastapi.Depends(get_current_user)):
    """Delete a single task for a user using SQLAlchemy/MySQL."""
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot delete other user's tasks")

    try:
        task = db.query(TaskModel).filter(
            TaskModel.id == int(taskId),
            TaskModel.user_id == int(userId)
        ).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        db.delete(task)
        db.commit()

        return {"message": "Task deleted", "deleted_count": 1}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")


# =============================================================================
# PROFILE ENDPOINTS (MySQL via SQLAlchemy)
# =============================================================================


def _user_to_profile_dict(user: UserModel) -> dict:
    """Convert a User ORM model to a profile dict (excluding password)."""
    return {
        "id": user.id,
        "firstName": user.firstName or "",
        "lastName": user.lastName or "",
        "email": user.email or "",
        "dateOfBirth": user.dateOfBirth or "",
        "profession": user.profession or "",
        "bio": user.bio or "",
        "location": user.location or "",
        "phone": user.phone or "",
        "profilePicture": user.profilePicture or "",
        "delete_attempts": user.delete_attempts or 0,
        "delete_lockout_until": user.delete_lockout_until,
        "created_at": user.created_at,
        "modified_at": user.modified_at,
    }


def _get_lockout_status(user: UserModel) -> dict:
    """Calculate lockout status for the frontend."""
    now = datetime.now(UTC_TIMEZONE)
    lockout_until = user.delete_lockout_until
    delete_attempts = user.delete_attempts or 0

    is_locked = False
    lockout_remaining = None

    if lockout_until:
        if lockout_until.tzinfo is None:
            lockout_until = lockout_until.replace(tzinfo=UTC_TIMEZONE)

        if lockout_until > now:
            is_locked = True
            remaining = lockout_until - now
            hours = int(remaining.total_seconds() // 3600)
            minutes = int((remaining.total_seconds() % 3600) // 60)
            lockout_remaining = {
                "hours": hours,
                "minutes": minutes,
                "total_seconds": int(remaining.total_seconds())
            }

    return {
        "is_locked": is_locked,
        "lockout_until": lockout_until.isoformat() if lockout_until else None,
        "delete_attempts": delete_attempts,
        "attempts_remaining": max(0, 3 - delete_attempts),
        "lockout_remaining": lockout_remaining
    }


@app.get("/users/{userId}/profile")
def get_user_profile(userId: int, db: Session = Depends(get_db), payload: dict = fastapi.Depends(get_current_user)):
    """Fetch user profile data using SQLAlchemy/MySQL.

    Validates that the requester matches `userId` and returns the user's
    profile data (excluding password). Includes delete attempt lockout status.
    """
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's profile")

    try:
        user = db.query(UserModel).filter(UserModel.id == int(userId)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        profile = _user_to_profile_dict(user)
        profile["delete_lockout_status"] = _get_lockout_status(user)

        return {"userId": userId, "profile": profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")


@app.put("/users/{userId}/profile")
def update_user_profile(
    userId: int,
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db),
    payload: dict = fastapi.Depends(get_current_user)
):
    """Update user profile data using SQLAlchemy/MySQL.

    Validates that the requester matches `userId` and updates the user's
    profile with partial updates.
    """
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's profile")

    try:
        user = db.query(UserModel).filter(UserModel.id == int(userId)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prepare update - only include fields that are not None
        update_data = profile_update.model_dump(exclude_unset=True)
        if not update_data:
            return {"message": "No fields to update", "userId": userId}

        # Apply updates to ORM model
        for field, value in update_data.items():
            if value is not None:
                setattr(user, field, value)

        user.modified_at = datetime.now(UTC_TIMEZONE)
        db.commit()
        db.refresh(user)

        profile = _user_to_profile_dict(user)

        return {
            "message": "Profile updated successfully",
            "userId": userId,
            "modified": True,
            "profile": profile
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


def process_profile_image(file_bytes: bytes) -> str:
    """Process uploaded image: apply EXIF orientation, crop to square, resize to 192x192, convert to JPEG 80% quality."""
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(file_bytes))

        # Apply EXIF orientation if present (fixes rotation issues from smartphones/cameras)
        image = ImageOps.exif_transpose(image)

        # Convert to RGB if necessary (for PNG with transparency)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # Center crop to square aspect ratio
        width, height = image.size
        min_dim = min(width, height)
        left = (width - min_dim) // 2
        top = (height - min_dim) // 2
        right = left + min_dim
        bottom = top + min_dim
        image = image.crop((left, top, right, bottom))

        # Resize to 192x192
        image = image.resize((192, 192), Image.Resampling.LANCZOS)

        # Convert to JPEG with 80% quality
        output_buffer = io.BytesIO()
        image.save(output_buffer, format='JPEG', quality=80, optimize=True)
        jpeg_bytes = output_buffer.getvalue()

        # Convert to Base64 with data URL prefix
        base64_data = base64.b64encode(jpeg_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_data}"

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")


@app.post("/users/{userId}/profile/picture")
async def upload_profile_picture(
    userId: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    payload: dict = fastapi.Depends(get_current_user)
):
    """Upload and process profile picture using SQLAlchemy/MySQL.

    Validates that the requester matches `userId`, processes the image,
    and updates the user's profilePicture field.
    """
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's profile")

    # Validate file size (max 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    file_contents = await file.read()
    if len(file_contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File must be less than 5MB")

    # Validate file type
    allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed_mime_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WebP images allowed")

    try:
        user = db.query(UserModel).filter(UserModel.id == int(userId)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Process image
        profile_picture_base64 = process_profile_image(file_contents)

        # Update user profile with new picture
        user.profilePicture = profile_picture_base64
        user.modified_at = datetime.now(UTC_TIMEZONE)
        db.commit()
        db.refresh(user)

        profile = _user_to_profile_dict(user)

        return {
            "message": "Profile picture uploaded successfully",
            "userId": userId,
            "modified": True,
            "profile": profile
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading profile picture: {str(e)}")


@app.delete("/users/{userId}/profile/picture")
def delete_profile_picture(
    userId: int,
    db: Session = Depends(get_db),
    payload: dict = fastapi.Depends(get_current_user)
):
    """Delete user's profile picture using SQLAlchemy/MySQL.

    Validates that the requester matches `userId` and removes the
    profilePicture field from the user document.
    """
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's profile")

    try:
        user = db.query(UserModel).filter(UserModel.id == int(userId)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.profilePicture:
            return {
                "message": "No profile picture to remove",
                "userId": userId,
                "modified": False
            }

        user.profilePicture = None
        user.modified_at = datetime.now(UTC_TIMEZONE)
        db.commit()
        db.refresh(user)

        profile = _user_to_profile_dict(user)

        return {
            "message": "Profile picture removed successfully",
            "userId": userId,
            "modified": True,
            "profile": profile
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error removing profile picture: {str(e)}")


@app.delete("/users/{userId}")
def delete_user_account(
    userId: int,
    delete_request: DeleteAccountRequest,
    db: Session = Depends(get_db),
    payload: dict = fastapi.Depends(get_current_user)
):
    """Delete user account and all associated tasks using SQLAlchemy/MySQL.

    Validates that the requester matches `userId`, verifies password,
    checks confirmation text, deletes all user tasks, then deletes user.
    Implements 3-attempt password limit with 24-hour lockout.
    """
    print(f"[DEBUG] Delete account request for user: {userId}")
    requesting_user = payload.get("user_id")
    if str(requesting_user) != str(userId):
        raise HTTPException(status_code=403, detail="Forbidden: cannot delete other user's account")

    try:
        user = db.query(UserModel).filter(UserModel.id == int(userId)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check for lockout
        now = datetime.now(UTC_TIMEZONE)
        lockout_until = user.delete_lockout_until
        print(f"[DEBUG] Current delete_attempts: {user.delete_attempts}, lockout_until: {lockout_until}")

        if lockout_until:
            if lockout_until.tzinfo is None:
                lockout_until = lockout_until.replace(tzinfo=UTC_TIMEZONE)

            if lockout_until > now:
                # Account is locked
                print(f"[DEBUG] Account is locked until: {lockout_until}")
                raise HTTPException(
                    status_code=400,
                    detail=DeleteErrorResponse.from_datetime(
                        detail="Account deletion locked for 24 hours.",
                        is_locked=True,
                        lockout_until=lockout_until,
                        attempts_remaining=0
                    ).model_dump()
                )

        # Verify password
        if not verify_password(delete_request.password, user.password):
            # Increment attempt counter
            current_attempts = (user.delete_attempts or 0) + 1
            remaining_attempts = 3 - current_attempts
            print(f"[DEBUG] Incorrect password. Attempt {current_attempts}/3. Remaining: {remaining_attempts}")

            if current_attempts >= 3:
                # Set 24-hour lockout
                lockout_until = now + timedelta(hours=24)
                user.delete_attempts = current_attempts
                user.delete_lockout_until = lockout_until
                db.commit()
                print(f"[DEBUG] Maximum attempts reached. Locking until: {lockout_until}")
                raise HTTPException(
                    status_code=400,
                    detail=DeleteErrorResponse.from_datetime(
                        detail="Incorrect password. Maximum attempts (3) reached. Account deletion locked for 24 hours.",
                        attempts_remaining=0,
                        is_locked=True,
                        lockout_until=lockout_until
                    ).model_dump()
                )
            else:
                # Update attempt counter
                user.delete_attempts = current_attempts
                db.commit()
                print(f"[DEBUG] Updated delete_attempts to: {current_attempts}")
                raise HTTPException(
                    status_code=400,
                    detail=DeleteErrorResponse.from_datetime(
                        detail=f"Incorrect password. {remaining_attempts} attempt(s) remaining.",
                        attempts_remaining=remaining_attempts,
                        is_locked=False,
                        lockout_until=None
                    ).model_dump()
                )

        # Password is correct - reset attempt counter and clear lockout
        print(f"[DEBUG] Password verified successfully. Resetting delete_attempts.")
        user.delete_attempts = 0
        user.delete_lockout_until = None

        # Verify confirmation text (case-insensitive)
        expected_text = "i want to delete my account"
        if delete_request.confirmationText.lower() != expected_text:
            print(f"[DEBUG] Invalid confirmation text: {delete_request.confirmationText}")
            raise HTTPException(
                status_code=400,
                detail=f'Confirmation text must be exactly "{expected_text}" (case-insensitive)'
            )

        print(f"[DEBUG] Confirmation text verified. Deleting tasks and user...")

        # Delete all tasks for the user (cascade should handle this, but be explicit)
        try:
            db.query(TaskModel).filter(TaskModel.user_id == int(userId)).delete()
            print(f"[DEBUG] Deleted tasks for user {userId}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting user tasks: {str(e)}")

        # Delete the user
        try:
            db.delete(user)
            db.commit()
            print(f"[DEBUG] User deleted successfully")
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

        return {
            "message": "Account deleted successfully",
            "userId": userId,
            "user_deleted": True
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Unexpected error in delete_user_account: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
