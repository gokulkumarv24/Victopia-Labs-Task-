from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.models.task import Base
from app.api import tasks, auth

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Task Management System with AI",
    description="A task management application with natural language AI integration using Gemini",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])


@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "message": "Task Management System with AI",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "Create, read, update, delete tasks",
            "State-based task workflow (Not Started → In Progress → Completed)",
            "Natural language AI commands via Gemini API",
            "Centralized business logic and validation",
            "JWT-based authentication"
        ]
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)