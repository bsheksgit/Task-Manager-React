"""Task Manager Backend Application."""
import os
import time

from pydantic import BaseModel, EmailStr
import fastapi
import pymongo
import uvicorn
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware

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

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

class User(BaseModel):
    firstName: str
    lastName: str | None = None
    email: EmailStr
    password: str

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
def login(email: EmailStr, password: str):
    """Endpoint to handle user login."""
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(400, "Invalid email or password")

    if not verify_password(password, user["password"]):
        raise HTTPException(400, "Invalid email or password")

    return {"message": f"Login successful for user {user['firstName']}", "user_id": str(user["_id"])}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
