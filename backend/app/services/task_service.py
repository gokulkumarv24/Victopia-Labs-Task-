from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.task import Task, User
from app.schemas.task import TaskCreate, TaskUpdate, TaskState, TaskPriority
from app.core.security import get_password_hash
from datetime import datetime, date, time


class TaskStateService:
    """
    Centralized service for task state management and validation.
    This service contains ALL business logic related to task states.
    UI and AI layers must use this service and cannot bypass it.
    """
    
    @staticmethod
    def validate_state_transition(current_state: TaskState, new_state: TaskState) -> bool:
        """
        Validates if a state transition is allowed.
        This is the single source of truth for state transition rules.
        """
        return TaskState.is_valid_transition(current_state, new_state)
    
    @staticmethod
    def get_allowed_transitions(current_state: TaskState) -> List[TaskState]:
        """Get all allowed state transitions from current state"""
        return TaskState.get_valid_transitions(current_state)


class TaskService:
    """
    Core business logic service for task operations.
    All task operations must go through this service to ensure consistency.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_task(self, task: TaskCreate, user_id: int) -> Task:
        """Create a new task with scheduling support (always starts in Not Started state)"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Creating task: '{task.title}' for user {user_id}")
        
        db_task = Task(
            title=task.title,
            description=task.description,
            state=TaskState.NOT_STARTED,  # Always starts in Not Started
            priority=task.priority or TaskPriority.MEDIUM,
            category=task.category,
            scheduled_date=task.scheduled_date,
            scheduled_time=task.scheduled_time,
            due_date=task.due_date,
            due_time=task.due_time,
            reminder_time=task.reminder_time,
            user_id=user_id
        )
        
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        
        logger.info(f"Successfully created task with ID {db_task.id}: '{db_task.title}'")
        
        return db_task
    
    def get_task(self, task_id: int, user_id: int) -> Optional[Task]:
        """Get a single task by ID for a specific user"""
        return self.db.query(Task).filter(
            Task.id == task_id, 
            Task.user_id == user_id
        ).first()
    
    def get_tasks(self, user_id: int, state_filter: Optional[TaskState] = None) -> List[Task]:
        """Get all tasks for a user, optionally filtered by state"""
        query = self.db.query(Task).filter(Task.user_id == user_id)
        if state_filter:
            query = query.filter(Task.state == state_filter)
        return query.all()
    
    def update_task(self, task_id: int, task_update: TaskUpdate, user_id: int) -> Task:
        """
        Update a task with validation.
        State transitions are validated through TaskStateService.
        """
        db_task = self.get_task(task_id, user_id)
        if not db_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Update basic fields
        if task_update.title is not None:
            db_task.title = task_update.title
        if task_update.description is not None:
            db_task.description = task_update.description
        if task_update.priority is not None:
            db_task.priority = task_update.priority
        if task_update.category is not None:
            db_task.category = task_update.category
        if task_update.scheduled_date is not None:
            db_task.scheduled_date = task_update.scheduled_date
        if task_update.scheduled_time is not None:
            db_task.scheduled_time = task_update.scheduled_time
        if task_update.due_date is not None:
            db_task.due_date = task_update.due_date
        if task_update.due_time is not None:
            db_task.due_time = task_update.due_time
        if task_update.reminder_time is not None:
            db_task.reminder_time = task_update.reminder_time
        
        # Handle state transition with validation
        if task_update.state is not None:
            if not TaskStateService.validate_state_transition(db_task.state, task_update.state):
                current_transitions = TaskStateService.get_allowed_transitions(db_task.state)
                allowed_states = [state.value for state in current_transitions]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid state transition from '{db_task.state.value}' to '{task_update.state.value}'. Allowed transitions: {allowed_states}"
                )
            db_task.state = task_update.state
        
        self.db.commit()
        self.db.refresh(db_task)
        return db_task
    
    def delete_task(self, task_id: int, user_id: int) -> bool:
        """Delete a task"""
        db_task = self.get_task(task_id, user_id)
        if not db_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        self.db.delete(db_task)
        self.db.commit()
        return True
    
    def search_tasks_by_title(self, title_pattern: str, user_id: int) -> List[Task]:
        """Search tasks by title pattern (for AI command handling)"""
        return self.db.query(Task).filter(
            Task.user_id == user_id,
            Task.title.contains(title_pattern)
        ).all()


class UserService:
    """Service for user management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, username: str, password: str) -> User:
        """Create a new user"""
        # Check if user exists
        if self.get_user_by_username(username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        db_user = User(
            username=username,
            hashed_password=get_password_hash(password)
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()