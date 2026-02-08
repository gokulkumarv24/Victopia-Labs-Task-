# Project Structure

```
task-management-system/
│
├── README.md                          # Comprehensive documentation
├── setup.sh                           # Unix/macOS setup script
├── setup.bat                          # Windows setup script
│
├── backend/                           # FastAPI Backend
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Environment template
│   ├── .gitignore                     # Git ignore rules
│   ├── main.py                        # FastAPI application entry
│   │
│   └── app/                           # Application package
│       ├── core/                      # Core utilities
│       │   ├── config.py              # Configuration management
│       │   ├── database.py            # Database setup
│       │   └── security.py            # Authentication utilities
│       │
│       ├── models/                    # Database models
│       │   └── task.py                # Task and User models
│       │
│       ├── schemas/                   # Pydantic schemas
│       │   └── task.py                # Request/response schemas
│       │
│       ├── services/                  # Business logic layer
│       │   ├── task_service.py        # Task business logic
│       │   └── ai_service.py          # AI command processing
│       │
│       └── api/                       # API routes
│           ├── auth.py                # Authentication endpoints
│           └── tasks.py               # Task management endpoints
│
└── frontend/                          # React Frontend
    ├── package.json                   # Node.js dependencies
    ├── tailwind.config.js             # Tailwind configuration
    ├── postcss.config.js              # PostCSS configuration
    ├── .gitignore                     # Git ignore rules
    │
    ├── public/                        # Static assets
    │   └── index.html                 # HTML template
    │
    └── src/                           # Source code
        ├── index.tsx                  # React application entry
        ├── App.tsx                    # Main App component
        ├── index.css                  # Global styles
        │
        ├── types/                     # TypeScript type definitions
        │   └── index.ts               # Shared types
        │
        ├── services/                  # API services
        │   └── api.ts                 # HTTP client and API calls
        │
        ├── hooks/                     # React hooks
        │   └── useApi.ts              # Custom API hooks
        │
        └── components/                # React components
            ├── AuthForm.tsx           # Login/register form
            ├── TaskForm.tsx           # Task creation form
            ├── TaskCard.tsx           # Individual task display
            ├── TaskFilters.tsx        # Task state filtering
            ├── AIAssistant.tsx        # AI chat interface
            └── Dashboard.tsx          # Main application view
```

## Architecture Layers

### Backend Layers

1. **API Layer** (`api/`) - HTTP endpoints and request handling
2. **Service Layer** (`services/`) - Business logic and validation
3. **Data Layer** (`models/`) - Database models and queries
4. **Core Layer** (`core/`) - Configuration and utilities

### Frontend Layers

1. **Component Layer** (`components/`) - UI components
2. **Service Layer** (`services/`) - API communication
3. **Hook Layer** (`hooks/`) - State management
4. **Type Layer** (`types/`) - Type definitions

## Key Design Principles

- **Separation of Concerns**: Each layer has distinct responsibilities
- **Dependency Injection**: Services injected into dependent layers
- **Type Safety**: Full TypeScript coverage on frontend
- **Centralized State**: Business logic centralized in services
- **API First**: Backend designed as API-first architecture
