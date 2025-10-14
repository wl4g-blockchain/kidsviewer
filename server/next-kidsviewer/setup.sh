#!/bin/bash

# KidsViewer Next.js Backend Setup Script

echo "🚀 Setting up KidsViewer Next.js Backend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the server/next-kidsviewer directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Please copy env.example to .env.local and configure your environment variables."
    echo "   You can run: cp env.example .env.local"
fi

# Generate RSA keys if not exists
if [ ! -f ".env.local" ] || ! grep -q "RSA_PRIVATE_KEY" .env.local; then
    echo "🔑 Generating RSA keys..."
    ./scripts/generate-rsa-keys.sh
fi

# Check if database is configured
if [ ! -f ".env.local" ] || ! grep -q "DATABASE_URL" .env.local; then
    echo "⚠️  Warning: DATABASE_URL not configured in .env.local"
    echo "   Please configure your database connection before running the application."
fi

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file with database and OAuth credentials"
echo "2. Run database migrations: npm run migrate:db:upgrade:from-schema"
echo "3. Seed the database: npm run migrate:db:init:data"
echo "4. Start the development server: npm run dev"
echo ""
echo "The application will be available at http://localhost:3001"
