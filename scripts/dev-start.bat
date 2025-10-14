@echo off
echo 🚀 Starting Repair Asset FIT Backend Development Environment...

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ Please update .env file with your configuration
)

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Start Docker services
echo 🐳 Starting Docker services...
docker-compose up -d postgres redis

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak > nul

REM Start development server
echo 🌟 Starting development server...
pnpm run start:dev