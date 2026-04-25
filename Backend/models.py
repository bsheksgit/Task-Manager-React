"""SQLAlchemy ORM models for the Task Manager application."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """User account model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firstName = Column(String(100), nullable=False)
    lastName = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    dateOfBirth = Column(String(20), nullable=True)  # Store as ISO string "YYYY-MM-DD"
    profession = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    profilePicture = Column(Text, nullable=True)  # Base64 encoded image
    delete_attempts = Column(Integer, default=0)
    delete_lockout_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    modified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                         onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to tasks
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")


class Task(Base):
    """Task model for user tasks."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    todo_list = Column(Text, nullable=True, default="[]")  # JSON string array
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    modified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                         onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to user
    user = relationship("User", back_populates="tasks")
