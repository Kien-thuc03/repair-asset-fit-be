#!/bin/bash

echo "🚀 Starting Repair Asset FIT Backend Development Environment..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Please update .env file with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations (when available)
echo "🗄️ Running database migrations..."
# pnpm run migration:run

# Start development server
echo "🌟 Starting development server..."
pnpm run start:dev