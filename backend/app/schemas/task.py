from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime, date, time


class TaskState(str, Enum):
    """
    Task state enumeration with exact states as required.
    Transition rules: Not Started -> In Progress -> Completed
    """
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

    @classmethod
    def get_valid_transitions(cls, current_state: 'TaskState') -> list['TaskState']:
        """Get valid state transitions from current state"""
        transitions = {
            cls.NOT_STARTED: [cls.IN_PROGRESS],
            cls.IN_PROGRESS: [cls.COMPLETED],
            cls.COMPLETED: []  # No transitions allowed from completed
        }
        return transitions.get(current_state, [])

    @classmethod
    def is_valid_transition(cls, from_state: 'TaskState', to_state: 'TaskState') -> bool:
        """Check if transition from one state to another is valid"""
        valid_transitions = cls.get_valid_transitions(from_state)
        return to_state in valid_transitions


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"  
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    category: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    reminder_time: Optional[int] = None  # minutes before due time


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    state: Optional[TaskState] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    reminder_time: Optional[int] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    state: TaskState
    created_at: datetime
    updated_at: datetime
    user_id: int


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class AICommandRequest(BaseModel):
    command: str


class AICommandResponse(BaseModel):
    success: bool
    message: str
    action: Optional[str] = None
    task_id: Optional[int] = None
    tasks: Optional[list[TaskResponse]] = None