@echo off
REM Setup script for Task Management System (Windows)

echo 🚀 Setting up Task Management System with AI...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup Backend
echo 📦 Setting up backend...
cd backend

REM Create virtual environment
python -m venv venv
call venv\Scripts\activate.bat

REM Install Python dependencies
pip install -r requirements.txt

REM Setup environment file
if not exist .env (
    copy .env.example .env
    echo ⚠️  Please edit backend\.env file and add your GEMINI_API_KEY
)

cd ..

REM Setup Frontend
echo 📦 Setting up frontend...
cd frontend
npm install
cd ..

echo ✅ Setup complete!
echo.
echo 🔧 Next steps:
echo 1. Edit backend\.env and add your Gemini API key
echo 2. Run: cd backend && python main.py (in one terminal)
echo 3. Run: cd frontend && npm start (in another terminal)
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs

pause