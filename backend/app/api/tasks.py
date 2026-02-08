from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import verify_token
from app.services.task_service import TaskService, UserService
from app.services.ai_service import AIService
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskState,
    AICommandRequest, AICommandResponse
)

router = APIRouter()
security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> int:
    """Get current user ID from JWT token"""
    username = verify_token(credentials.credentials)
    user_service = UserService(db)
    user = user_service.get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user.id


@router.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new task (always starts in 'Not Started' state)"""
    task_service = TaskService(db)
    return task_service.create_task(task, current_user_id)


@router.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    state: Optional[TaskState] = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all tasks for current user, optionally filtered by state"""
    task_service = TaskService(db)
    tasks = task_service.get_tasks(current_user_id, state)
    return tasks


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get a specific task by ID"""
    task_service = TaskService(db)
    task = task_service.get_task(task_id, current_user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Update a task. State transitions are validated:
    - Not Started -> In Progress
    - In Progress -> Completed
    """
    task_service = TaskService(db)
    return task_service.update_task(task_id, task_update, current_user_id)


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a task"""
    task_service = TaskService(db)
    task_service.delete_task(task_id, current_user_id)
    return {"message": "Task deleted successfully"}


@router.post("/tasks/ai-command", response_model=AICommandResponse)
async def process_ai_command(
    command_request: AICommandRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Process a natural language command using AI.
    
    The AI interprets the command and executes the appropriate action
    through the same TaskService used by manual operations.
    
    Examples:
    - "Add a task to prepare presentation"
    - "Start working on presentation task"  
    - "Mark presentation task as completed"
    - "Show all completed tasks"
    """
    task_service = TaskService(db)
    ai_service = AIService(task_service)
    
    return await ai_service.process_command(command_request.command, current_user_id)


@router.get("/tasks/states/transitions")
def get_state_transitions():
    """Get all possible state transitions for reference"""
    transitions = {}
    for state in TaskState:
        transitions[state.value] = [s.value for s in TaskState.get_valid_transitions(state)]
    
    return {
        "states": [state.value for state in TaskState],
        "transitions": transitions,
        "rules": [
            "Tasks start in 'Not Started'",
            "'Not Started' can only transition to 'In Progress'",
            "'In Progress' can only transition to 'Completed'", 
            "'Completed' is final - no further transitions allowed"
        ]
    }