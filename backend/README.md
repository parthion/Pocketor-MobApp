# Pocketor Backend - Setup & Run Guide

## ✅ All Files Created!

Your backend folder now contains all the required files:

```
backend/
├── config/
│   ├── database.js          ✅ MySQL connection
│   └── constants.js         ✅ Enums & constants
├── models/
│   ├── User.js              ✅ User entity
│   └── Collection.js        ✅ Collection entity
├── dto/
│   └── UserDTO.js           ✅ Data transfer objects
├── repositories/
│   ├── UserRepository.js    ✅ User database operations
│   └── CollectionRepository.js ✅ Collection database operations
├── routes/
│   ├── authRoutes.js        ✅ Authentication endpoints
│   └── collectionRoutes.js  ✅ Collection endpoints
├── middleware/
│   └── authMiddleware.js    ✅ JWT & validation
├── server.js                ✅ Main entry point
├── package.json             ✅ Dependencies
├── .env                     ✅ Configuration
├── .env.example             ✅ Example config
├── .gitignore               ✅ Git rules
└── VERIFY_SETUP.sh          ✅ Verification script
```

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

You should see:
```
added 125 packages in 45s
```

### Step 2: Create MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# Inside MySQL, run:
CREATE DATABASE pocketor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pocketor_user'@'localhost' IDENTIFIED BY 'pocketor_secure_123';
GRANT ALL PRIVILEGES ON pocketor_db.* TO 'pocketor_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Import Database Schema

```bash
# From your project root
mysql -u pocketor_user -p pocketor_db < database/schema.sql

# Enter password: pocketor_secure_123
```

Verify tables were created:
```bash
mysql -u pocketor_user -p pocketor_db
SHOW TABLES;
# Should show 6 tables
EXIT;
```

### Step 4: Update .env File

Check your `.backend/.env` file has:
```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=pocketor_user
DATABASE_PASSWORD=pocketor_secure_123
DATABASE_NAME=pocketor_db
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

### Step 5: Start the Server

```bash
npm start

# You should see:
# ✅ MySQL Database Connected Successfully!
# 📍 Server running on http://localhost:3000
```

---

## 🧪 Test the Server

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "Server is running",
  "timestamp": "2026-01-03T...",
  "environment": "development"
}
```

### Test 2: Database Health
```bash
curl http://localhost:3000/api/db-health
```

Response:
```json
{
  "status": "Database is connected",
  "database": "pocketor_db",
  "timestamp": "2026-01-03T..."
}
```

### Test 3: User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "phone": "9876543210",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Test 4: User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "name": "Test User",
      "phone": "9876543210"
    }
  }
}
```

---

## 📱 Connect Mobile App to Backend

Update `mobile/service/config.ts`:

```typescript
export const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
};
```

Or update `mobile/.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🚀 Development Mode (Auto-reload)

For automatic server restart on file changes:

```bash
npm run dev

# Uses nodemon - server restarts when you save files
```

---

## 📝 Available Endpoints

### Auth Endpoints
- `POST   /api/auth/register` - Register new user
- `POST   /api/auth/login` - Login user
- `GET    /api/auth/me` - Get current user (requires token)
- `POST   /api/auth/logout` - Logout (requires token)

### Collection Endpoints
- `GET    /api/collections` - Get all collections (requires token)
- `POST   /api/collections` - Create collection (requires token)
- `GET    /api/collections/:id` - Get collection by ID (requires token)
- `PUT    /api/collections/:id` - Update collection (requires token)
- `DELETE /api/collections/:id` - Delete collection (requires token)
- `GET    /api/collections/status/:status` - Get by status (requires token)

### Health Endpoints
- `GET    /api/health` - Server health check
- `GET    /api/db-health` - Database connection check

---

## ✨ Features Included

✅ User Registration with Password Hashing  
✅ User Login with JWT Tokens  
✅ Protected Routes (requires JWT token)  
✅ MySQL Database Integration  
✅ CRUD Operations for Collections  
✅ Error Handling  
✅ Input Validation  
✅ CORS Support  
✅ Environment Configuration  

---

## 🐛 Troubleshooting

### "Can't connect to database"
- Check MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Check credentials in `.env` are correct
- Make sure `pocketor_db` exists

### "Port 3000 is already in use"
```bash
# Change port in .env
PORT=3001

# Or kill the process using port 3000
# macOS: lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill
# Linux: sudo fuser -k 3000/tcp
```

### "JWT_SECRET not set"
- Check `.env` file has `JWT_SECRET` defined
- Don't commit `.env` to git (use `.env.example` as template)

### Token Expired
- Tokens expire after 24 hours
- Mobile app should handle token refresh
- Use login endpoint to get new token

---

## 📚 File Explanations

| File | Purpose |
|------|---------|
| `config/database.js` | MySQL connection pool (like DbContext in .NET) |
| `config/constants.js` | Enums & constants (like Enums in .NET) |
| `models/User.js` | User entity (like Entity in .NET) |
| `dto/UserDTO.js` | Data transfer objects (like DTO in .NET) |
| `repositories/UserRepository.js` | Database operations (like Repository in .NET) |
| `routes/authRoutes.js` | API endpoints (like Controller in .NET) |
| `middleware/authMiddleware.js` | JWT validation (like AuthAttribute in .NET) |
| `server.js` | Main entry point (like Program.cs in .NET) |

---

## ✅ Verification Checklist

- [ ] All files created in backend folder
- [ ] MySQL database created
- [ ] `.env` file updated with correct credentials
- [ ] `npm install` completed
- [ ] Database schema imported
- [ ] Server starts without errors
- [ ] `npm start` shows "Server running on http://localhost:3000"
- [ ] `/api/health` endpoint responds
- [ ] Can register new user
- [ ] Can login and get JWT token
- [ ] Mobile app can connect to backend

---

## 🎉 You're Ready!

Your backend is now ready to serve your Pocketor mobile app!

**Next Steps:**
1. Keep backend running: `npm start`
2. Open another terminal
3. Start mobile app: `cd mobile && npm start`
4. Both will communicate with each other

---

**Created**: January 3, 2026  
**Status**: ✅ COMPLETE  
**Ready to Use**: ✅ YES

