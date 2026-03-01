"""Task Manager Backend Application."""
import os
import time
from datetime import datetime, timedelta

from pydantic import BaseModel, EmailStr
import fastapi
import pymongo
import uvicorn
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt

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

@app.post("/save-user-task")
def protected_route(token: str = fastapi.Depends(lambda: fastapi.Header(..., alias="Authorization"))):
    """Protected endpoint that requires a valid JWT token to save a user's task."""
    try:
        payload = jwt.decode(token.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("email")
        return {"message": f"Access granted for user {email} with ID {user_id}"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token has expired")
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")



if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
