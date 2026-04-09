"""Task Manager Backend Application."""
import os
import time
import base64
import io
from datetime import datetime, timedelta, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr
import fastapi
import pymongo
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from bson import ObjectId
import uvicorn
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError, ExpiredSignatureError
from pydantic import Field
from fastapi import HTTPException, UploadFile, File
from PIL import Image, ImageOps

app = fastapi.FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection setup
client = pymongo.MongoClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017/"))
db = client["TaskManager"]
users_collection = db["users"]
tasks_collection = db["tasks"]
try:
    # Clean up any stale indexes that prevent multiple tasks per user
    try:
        indexes = tasks_collection.index_information()
        # remove accidental unique index on userId
        if 'userId_1' in indexes and indexes['userId_1'].get('unique'):
            tasks_collection.drop_index('userId_1')
        # remove any taskId index created previously (we will rely on MongoDB _id)
        if 'taskId_1' in indexes:
            try:
                tasks_collection.drop_index('taskId_1')
            except Exception:
                pass
    except Exception:
        # non-fatal; continue to recreate desired indexes
        pass

    # Ensure indexing by userId for queries
    tasks_collection.create_index([("userId", pymongo.ASCENDING)])
except Exception as e:
    print(f"Could not create indexes on tasks collection: {e}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = "025hjoP8smSyb2o-98d5Y1CLt_N53rqo0gzr5dFY9xY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10

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
    # Accept client-provided Mongo `_id` as the alias "_id" and expose it as `id`
    id: str | None = Field(None, alias="_id")
    created_at: datetime | None = None
    modified_at: datetime | None = None

class UserTasksRequest(BaseModel):
    tasks: list[UserTask]


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

@app.post("/signup")
def signup(user: User):
    """Endpoint to handle user signup."""

    user_dict = user.dict()
    time.sleep(2)  # Simulate processing delay

    existing = users_collection.find_one({"email": user.email})
    if existing:
        return {"error": HTTPException(400, "Error: A user with this email address already exists")}

    try:
        # Hash the password before storing it in the database
        # Truncate password to 72 bytes (bcrypt limit) before hashing
        user_dict["password"] = hash_password(user_dict["password"])
    except ValueError as e:
        return {"error": f"Invalid password: {str(e)}"}

    try:
        result = users_collection.insert_one(user_dict)
        return {"message": "User added successfully", "user_id": str(result.inserted_id)}
    except Exception as e:
        return {"error": f"Error occurred while adding user to database: {str(e)}"}


@app.post("/login")
def login(request: LoginRequest):
    """Endpoint to handle user login."""
    user = users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(400, "Invalid email or password")

    if not verify_password(request.password, user["password"]):
        raise HTTPException(400, "Invalid email or password")

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": str(user["_id"]), "email": user["email"]},
        expires_delta=access_token_expires
    )

    # Return profile data for frontend Redux store
    return {
        "message": f"Login successful for user {user['firstName']}",
        "user_id": str(user["_id"]),
        "token": access_token,
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
        "email": user.get("email", ""),
        "dateOfBirth": user.get("dateOfBirth", ""),
        "profession": user.get("profession", ""),
        "bio": user.get("bio", ""),
        "location": user.get("location", ""),
        "phone": user.get("phone", ""),
        "profilePicture": user.get("profilePicture", ""),
        "token_type": "bearer"
    }


@app.post("/users/{userId}/tasks")
def save_user_tasks(userId: str, tasks: UserTasksRequest, payload: dict = fastapi.Depends(get_current_user)):
    """Save a user's tasks: each task becomes its own document in `tasks` collection.

    Behavior: for each incoming task, backend assigns a `taskId` if missing and performs
    an upsert with `$setOnInsert` so existing tasks are left unchanged and only new
    tasks are inserted.
    """
    user_id = payload.get("user_id")
    # Verify that the authenticated user matches the path userId
    if user_id != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot save tasks for another user")

    # Use the parsed Pydantic list directly (attributes available as Python names)
    incoming = tasks.tasks or []

    if not incoming:
        return {"message": "No tasks provided"}

    now = datetime.now(UTC_TIMEZONE)

        # Separate new tasks (no id) from updates (client provided _id)
    new_docs = []
    update_ops = []
    for t in incoming:
        if t.id:
            # existing task: update fields (do not change _id)
            try:
                oid = ObjectId(t.id)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid _id value: {t.id}")
            update_doc = {
                "title": t.title,
                "description": t.description,
                "todoList": t.todoList or [],
                "modified_at": now,
            }
            update_ops.append(UpdateOne({"_id": oid, "userId": user_id}, {"$set": update_doc}, upsert=False))
        else:
            # new task: server will let Mongo generate _id
            doc = {
                "userId": user_id,
                "title": t.title,
                "description": t.description,
                "todoList": t.todoList or [],
                "created_at": now,
                "modified_at": now,
            }
            new_docs.append(doc)

    inserted_ids = []
    try:
        if new_docs:
            ins_result = tasks_collection.insert_many(new_docs)
            inserted_ids = [str(i) for i in ins_result.inserted_ids]

        update_result = None
        if update_ops:
            update_result = tasks_collection.bulk_write(update_ops, ordered=False)

        return {
            "message": f"Inserted {len(inserted_ids)} new task(s)",
            "inserted_ids": inserted_ids,
            "update_result": {
                "matched": getattr(update_result, "matched_count", 0) if update_result is not None else 0,
                "modified": getattr(update_result, "modified_count", 0) if update_result is not None else 0,
            },
        }
    except BulkWriteError as bwe:
        detail = {"bulk_write_error": bwe.details}
        raise HTTPException(status_code=400, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving task: {str(e)}")


@app.get("/users/{userId}/tasks")
def get_user_tasks(userId: str, payload: dict = fastapi.Depends(get_current_user)):
    """Fetch all tasks for a given `userId`. Requires Authorization header.

    The endpoint verifies the JWT payload `user_id` matches the requested
    `userId` and returns all tasks for that user (with `_id` converted to string).
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's tasks")

    try:
        # Sort by created_at in ascending order (oldest first), then by _id for consistency
        cursor = tasks_collection.find({"userId": userId}).sort([("created_at", pymongo.ASCENDING), ("_id", pymongo.ASCENDING)])
        tasks = []
        for t in cursor:
            t["_id"] = str(t["_id"]) if "_id" in t else None
            t["todoList"] = t.get("todoList", [])
            # Ensure timestamps are timezone-aware (UTC)
            if "created_at" in t and t["created_at"]:
                t["created_at"] = t["created_at"].replace(tzinfo=UTC_TIMEZONE)
            if "modified_at" in t and t["modified_at"]:
                t["modified_at"] = t["modified_at"].replace(tzinfo=UTC_TIMEZONE)
            tasks.append(t)

        return {"userId": userId, "tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")


@app.get("/users/{userId}/tasks/{taskId}")
def get_user_task(userId: str, taskId: str, payload: dict = fastapi.Depends(get_current_user)):
    """Fetch a specific task for a user. Requires Authorization header.

    Validates that the requester matches `userId` and returns the task with
    `_id` == `taskId` and `userId` == userId.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's tasks")

    try:
        try:
            oid = ObjectId(taskId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid task id: {taskId}")

        task = tasks_collection.find_one({"_id": oid, "userId": userId})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

                # Convert ObjectId to string for JSON serialization
        task["_id"] = str(task["_id"])
        task["todoList"] = task.get("todoList", [])
        # Ensure timestamps are timezone-aware (UTC)
        if "created_at" in task and task["created_at"]:
            task["created_at"] = task["created_at"].replace(tzinfo=UTC_TIMEZONE)
        if "modified_at" in task and task["modified_at"]:
            task["modified_at"] = task["modified_at"].replace(tzinfo=UTC_TIMEZONE)

        return {"userId": userId, "task": task}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching task: {str(e)}")


@app.post("/users/{userId}/tasks/{taskId}")
def update_user_task(
    userId: str, 
    taskId: str, 
    task_update: UserTask, 
    payload: dict = fastapi.Depends(get_current_user)
):
    """Update a specific task for a user. Requires Authorization header.

    Validates that the requester matches `userId` and updates the task with
    `_id` == `taskId` and `userId` == userId.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's tasks")

    try:
        try:
            oid = ObjectId(taskId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid task id: {taskId}")

        # Check if task exists and belongs to user
        existing_task = tasks_collection.find_one({"_id": oid, "userId": userId})
        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")

                # Prepare update document
        now = datetime.now(UTC_TIMEZONE)
        update_doc = {
            "title": task_update.title,
            "description": task_update.description,
            "todoList": task_update.todoList or [],
            "modified_at": now,
        }

        # Update the task
        result = tasks_collection.update_one(
            {"_id": oid, "userId": userId},
            {"$set": update_doc}
        )

        if result.modified_count == 0:
            # Task was found but not modified (same data)
            return {
                "message": "Task already up to date",
                "taskId": taskId,
                "modified": False
            }

                # Fetch and return the updated task
        updated_task = tasks_collection.find_one({"_id": oid, "userId": userId})
        updated_task["_id"] = str(updated_task["_id"])
        updated_task["todoList"] = updated_task.get("todoList", [])
        updated_task["modified_at"] = now
        # Ensure timestamps are timezone-aware (UTC)
        if "created_at" in updated_task and updated_task["created_at"]:
            updated_task["created_at"] = updated_task["created_at"].replace(tzinfo=UTC_TIMEZONE)
        updated_task["modified_at"] = now.replace(tzinfo=UTC_TIMEZONE)

        return {
            "message": "Task updated successfully",
            "taskId": taskId,
            "modified": True,
            "task": updated_task
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")


@app.delete("/users/{userId}/tasks/{taskId}")
def delete_user_task(userId: str, taskId: str, payload: dict = fastapi.Depends(get_current_user)):
    """Delete a single task for a user. Requires Authorization header.

    Validates that the requester matches `userId` and deletes the task with
    `_id` == `taskId` and `userId` == userId. Returns deleted_count.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot delete other user's tasks")

    try:
        try:
            oid = ObjectId(taskId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid task id: {taskId}")

        result = tasks_collection.delete_one({"_id": oid, "userId": userId})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")

        return {"message": "Task deleted", "deleted_count": result.deleted_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")


@app.get("/users/{userId}/profile")
def get_user_profile(userId: str, payload: dict = fastapi.Depends(get_current_user)):
    """Fetch user profile data. Requires Authorization header.
    
    Validates that the requester matches `userId` and returns the user's
    profile data (excluding password).
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's profile")
    
    try:
        try:
            oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid user id: {userId}")
        
        user = users_collection.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove password from response
        user.pop("password", None)
        # Convert ObjectId to string
        user["_id"] = str(user["_id"])
        
        return {"userId": userId, "profile": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")


@app.put("/users/{userId}/profile")
def update_user_profile(
    userId: str,
    profile_update: UserProfileUpdate,
    payload: dict = fastapi.Depends(get_current_user)
):
    """Update user profile data. Requires Authorization header.
    
    Validates that the requester matches `userId` and updates the user's
    profile with partial updates.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's profile")
    
    try:
        try:
            oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid user id: {userId}")
        
        # Check if user exists
        user = users_collection.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update document - only include fields that are not None
        update_doc = {}
        for field, value in profile_update.dict(exclude_unset=True).items():
            if value is not None:
                update_doc[field] = value
        
        if not update_doc:
            return {"message": "No fields to update", "userId": userId}
        
        # Update the user profile
        result = users_collection.update_one(
            {"_id": oid},
            {"$set": update_doc}
        )
        
        if result.modified_count == 0:
            # User was found but not modified (same data)
            return {
                "message": "Profile already up to date",
                "userId": userId,
                "modified": False
            }
        
        # Fetch and return the updated user (excluding password)
        updated_user = users_collection.find_one({"_id": oid})
        updated_user.pop("password", None)
        updated_user["_id"] = str(updated_user["_id"])
        
        return {
            "message": "Profile updated successfully",
            "userId": userId,
            "modified": True,
            "profile": updated_user
        }
    except HTTPException:
        raise
    except Exception as e:
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
    userId: str,
    file: UploadFile = File(...),
    payload: dict = fastapi.Depends(get_current_user)
):
    """Upload and process profile picture. Requires Authorization header.
    
    Validates that the requester matches `userId`, processes the image,
    and updates the user's profilePicture field.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
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
        try:
            oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid user id: {userId}")
        
        # Check if user exists
        user = users_collection.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Process image
        profile_picture_base64 = process_profile_image(file_contents)
        
        # Update user profile with new picture
        result = users_collection.update_one(
            {"_id": oid},
            {"$set": {"profilePicture": profile_picture_base64}}
        )
        
        if result.modified_count == 0:
            # User was found but picture already same (unlikely with new upload)
            return {
                "message": "Profile picture already up to date",
                "userId": userId,
                "modified": False
            }
        
        # Fetch and return the updated user (excluding password)
        updated_user = users_collection.find_one({"_id": oid})
        updated_user.pop("password", None)
        updated_user["_id"] = str(updated_user["_id"])
        
        return {
            "message": "Profile picture uploaded successfully",
            "userId": userId,
            "modified": True,
            "profile": updated_user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading profile picture: {str(e)}")


@app.delete("/users/{userId}/profile/picture")
def delete_profile_picture(
    userId: str,
    payload: dict = fastapi.Depends(get_current_user)
):
    """Delete user's profile picture. Requires Authorization header.
    
    Validates that the requester matches `userId` and removes the
    profilePicture field from the user document.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot update other user's profile")
    
    try:
        try:
            oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid user id: {userId}")
        
        # Check if user exists
        user = users_collection.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove profilePicture field
        result = users_collection.update_one(
            {"_id": oid},
            {"$unset": {"profilePicture": ""}}
        )
        
        if result.modified_count == 0 and "profilePicture" not in user:
            # No picture existed
            return {
                "message": "No profile picture to remove",
                "userId": userId,
                "modified": False
            }
        
        # Fetch and return the updated user (excluding password)
        updated_user = users_collection.find_one({"_id": oid})
        updated_user.pop("password", None)
        updated_user["_id"] = str(updated_user["_id"])
        
        return {
            "message": "Profile picture removed successfully",
            "userId": userId,
            "modified": True,
            "profile": updated_user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing profile picture: {str(e)}")


@app.delete("/users/{userId}")
def delete_user_account(
    userId: str,
    delete_request: DeleteAccountRequest,
    payload: dict = fastapi.Depends(get_current_user)
):
    """Delete user account and all associated tasks. Requires Authorization header.
    
    Validates that the requester matches `userId`, verifies password,
    checks confirmation text, deletes all user tasks, then deletes user.
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot delete other user's account")
    
    try:
        try:
            oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid user id: {userId}")
        
        # Check if user exists
        user = users_collection.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify password
        if not verify_password(delete_request.password, user["password"]):
            raise HTTPException(status_code=400, detail="Incorrect password")
        
        # Verify confirmation text (case-insensitive)
        expected_text = "i want to delete my account"
        if delete_request.confirmationText.lower() != expected_text:
            raise HTTPException(
                status_code=400, 
                detail=f'Confirmation text must be exactly "{expected_text}" (case-insensitive)'
            )
        
        # Delete all tasks for the user first
        tasks_result = tasks_collection.delete_many({"userId": userId})
        tasks_deleted = tasks_result.deleted_count
        
        # Delete the user
        user_result = users_collection.delete_one({"_id": oid})
        if user_result.deleted_count == 0:
            # This should not happen since we just found the user, but handle anyway
            raise HTTPException(status_code=500, detail="Failed to delete user account")
        
        return {
            "message": "Account deleted successfully",
            "userId": userId,
            "tasks_deleted": tasks_deleted,
            "user_deleted": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
