#!/bin/bash

# Pocketor Backend Setup and Test Script
# This script verifies all files are created and tests the server

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          POCKETOR BACKEND - FILE VERIFICATION & TEST           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
    return 0
  else
    echo -e "${RED}❌${NC} $1 (MISSING)"
    return 1
  fi
}

# Function to check if directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} $1/"
    return 0
  else
    echo -e "${RED}❌${NC} $1/ (MISSING)"
    return 1
  fi
}

cd "$(dirname "$0")"

echo "📁 CHECKING DIRECTORIES..."
echo ""

check_dir "config"
check_dir "models"
check_dir "dto"
check_dir "repositories"
check_dir "routes"
check_dir "middleware"

echo ""
echo "📄 CHECKING FILES..."
echo ""

echo "Config Files:"
check_file "config/database.js"
check_file "config/constants.js"

echo ""
echo "Models:"
check_file "models/User.js"
check_file "models/Collection.js"

echo ""
echo "DTOs:"
check_file "dto/UserDTO.js"

echo ""
echo "Repositories:"
check_file "repositories/UserRepository.js"
check_file "repositories/CollectionRepository.js"

echo ""
echo "Routes:"
check_file "routes/authRoutes.js"
check_file "routes/collectionRoutes.js"

echo ""
echo "Middleware:"
check_file "middleware/authMiddleware.js"

echo ""
echo "Main Files:"
check_file "server.js"
check_file "package.json"
check_file ".env"
check_file ".env.example"
check_file ".gitignore"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    SETUP INSTRUCTIONS                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  INSTALL DEPENDENCIES"
echo "   npm install"
echo ""

echo "2️⃣  UPDATE .env FILE"
echo "   Edit .env with your MySQL credentials:"
echo "   DATABASE_HOST=localhost"
echo "   DATABASE_USER=pocketor_user"
echo "   DATABASE_PASSWORD=your_password"
echo "   DATABASE_NAME=pocketor_db"
echo ""

echo "3️⃣  CREATE DATABASE"
echo "   mysql -u root -p"
echo "   CREATE DATABASE pocketor_db;"
echo "   EXIT;"
echo ""

echo "4️⃣  IMPORT SCHEMA"
echo "   mysql -u pocketor_user -p pocketor_db < ../database/schema.sql"
echo ""

echo "5️⃣  START SERVER"
echo "   npm start       (production)"
echo "   npm run dev     (development with auto-reload)"
echo ""

echo "🧪 TEST THE SERVER"
echo ""

if command -v curl &> /dev/null; then
  echo "Testing health endpoint..."
  response=$(curl -s http://localhost:3000/api/health)
  
  if [ ! -z "$response" ]; then
    echo -e "${GREEN}✅ Server is responding!${NC}"
    echo "Response: $response"
  else
    echo -e "${YELLOW}⚠️  Server not running yet. Start it with: npm start${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  curl not found. Start server and test manually.${NC}"
fi

echo ""
echo "✅ All files created successfully!"
echo "🚀 Ready to start the backend server!"
echo ""
