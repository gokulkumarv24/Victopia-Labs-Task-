#!/bin/bash
# Setup script for Task Management System

echo "🚀 Setting up Task Management System with AI..."

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
python -m venv venv
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install Python dependencies
pip install -r requirements.txt

# Setup environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env file and add your GEMINI_API_KEY"
fi

cd ..

# Setup Frontend
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit backend/.env and add your Gemini API key"
echo "2. Run: cd backend && python main.py (in one terminal)"
echo "3. Run: cd frontend && npm start (in another terminal)"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"