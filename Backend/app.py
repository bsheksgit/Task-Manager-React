"""Task Manager Backend Application."""
import os
import time
from datetime import datetime, timedelta, timezone

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

from fastapi import HTTPException

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
ACCESS_TOKEN_EXPIRE_MINUTES = 10  # 24 hours

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

class User(BaseModel):
    firstName: str
    lastName: str | None = None
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

from pydantic import Field

class UserTask(BaseModel):
    title: str
    description: str
    todoList: list[str] | None = None
    # Accept client-provided Mongo `_id` as the alias "_id" and expose it as `id`
    id: str | None = Field(None, alias="_id")

class UserTasksRequest(BaseModel):
    userId: str
    tasks: list[UserTask]



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

    return {
        "message": f"Login successful for user {user['firstName']}",
        "user_id": str(user["_id"]),
        "token": access_token,
        "firstName": user["firstName"],
        "token_type": "bearer"
    }

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


@app.post("/save-user-tasks")
def save_user_tasks(tasks: UserTasksRequest, payload: dict = fastapi.Depends(get_current_user)):
    """Save a user's tasks: each task becomes its own document in `tasks` collection.

    Behavior: for each incoming task, backend assigns a `taskId` if missing and performs
    an upsert with `$setOnInsert` so existing tasks are left unchanged and only new
    tasks are inserted.
    """
    user_id = payload.get("user_id")

    # Use the parsed Pydantic list directly (attributes available as Python names)
    incoming = tasks.tasks or []

    if not incoming:
        return {"message": "No tasks provided"}

    now = datetime.now(timezone.utc)

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
                "written_at": now,
            }
            update_ops.append(UpdateOne({"_id": oid, "userId": user_id}, {"$set": update_doc}, upsert=False))
        else:
            # new task: server will let Mongo generate _id
            doc = {
                "userId": user_id,
                "title": t.title,
                "description": t.description,
                "todoList": t.todoList or [],
                "written_at": now,
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


@app.get("/get-user-tasks")
def get_user_tasks(userId: str, payload: dict = fastapi.Depends(get_current_user)):
    """Fetch all tasks for a given `userId`. Requires Authorization header.

    The endpoint verifies the JWT payload `user_id` matches the requested
    `userId` and returns all tasks for that user (with `_id` converted to string).
    """
    requesting_user = payload.get("user_id")
    if requesting_user != userId:
        raise HTTPException(status_code=403, detail="Forbidden: cannot access other user's tasks")

    try:
        cursor = tasks_collection.find({"userId": userId}).sort("written_at", pymongo.DESCENDING)
        tasks = []
        for t in cursor:
            t["_id"] = str(t["_id"]) if "_id" in t else None
            t["todoList"] = t.get("todoList", [])
            tasks.append(t)

        return {"userId": userId, "tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")



if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)


@app.delete("/delete-user-task")
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
