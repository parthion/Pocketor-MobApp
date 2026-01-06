# Service Layer - API Management

This folder contains all API services for the Pocketor application, organized by feature domain.

## 📁 File Structure

```
service/
├── index.ts                 # Central export point
├── config.ts                # API configuration and helpers
├── types.ts                 # TypeScript types and interfaces
├── auth.service.ts          # Authentication APIs
├── collections.service.ts   # Collections management APIs
└── README.md               # This file
```

## 🎯 Services Overview

### 1. Auth Service (`auth.service.ts`)
Handles user authentication and session management.

**Functions:**
- `registerUser()` - Register new user
- `loginWithEmail()` - Login with email
- `loginWithPhone()` - Login with phone
- `sendOTP()` - Send OTP code
- `verifyOTP()` - Verify OTP code
- `forgotPassword()` - Request password reset
- `resetPassword()` - Reset password with token
- `getCurrentUser()` - Get authenticated user info
- `refreshAuthToken()` - Refresh JWT token
- `logoutUser()` - Logout and clear tokens
- `getAuthToken()` - Get stored auth token
- `clearAuthTokens()` - Clear all tokens

**Usage:**
```typescript
import { registerUser, loginWithEmail } from '@/service';

// Register
const response = await registerUser('user@example.com', 'password', 'John', '9876543210');

// Login
const loginResponse = await loginWithEmail('user@example.com', 'password');
```

### 2. Collections Service (`collections.service.ts`)
Manages collections, members, and contributions.

**Functions:**
- `getAllCollections()` - List all collections
- `getCollectionById()` - Get collection details
- `createCollection()` - Create new collection
- `updateCollection()` - Update collection
- `deleteCollection()` - Delete collection
- `addMemberToCollection()` - Add member
- `removeMemberFromCollection()` - Remove member
- `recordContribution()` - Record contribution
- `getCollectionMembers()` - Get members list
- `getCollectionContributions()` - Get contributions
- `getCollectionStats()` - Get statistics
- `searchCollections()` - Search collections

**Usage:**
```typescript
import { createCollection, recordContribution } from '@/service';

// Create collection
const collection = await createCollection({
  name: 'Monthly Collection',
  interestRate: 5.0
});

// Record contribution
const contrib = await recordContribution(collectionId, {
  memberId: memberId,
  amount: 1000
});
```

## 🔧 Config (`config.ts`)

**Exports:**
- `API_BASE_URL` - Backend server URL
- `getAuthHeaders()` - Get headers with JWT token
- `getPublicHeaders()` - Get headers without auth
- `handleUnauthorized()` - Handle 401 responses
- `API_TIMEOUT` - Request timeout
- `RETRY_CONFIG` - Retry configuration

**Environment Variables:**
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_API_TIMEOUT=10000
```

## 📦 Types (`types.ts`)

**Exported Types:**
- `ApiResponse<T>` - Standard API response
- `User` - User interface
- `Collection` - Collection interface
- `Member` - Member interface
- `Contribution` - Contribution interface
- `LoginResponse` - Login response
- `RegisterResponse` - Registration response
- `PaginatedResponse<T>` - Paginated data

## 📖 Import Examples

### From index (recommended)
```typescript
import { 
  registerUser, 
  loginWithEmail,
  createCollection,
  recordContribution,
  type User,
  type Collection
} from '@/service';
```

### From specific service
```typescript
import { registerUser } from '@/service/auth.service';
import { createCollection } from '@/service/collections.service';
```

## 🔐 Authentication Flow

1. **Register**
   ```typescript
   const response = await registerUser(email, password, name, phone);
   ```

2. **Login**
   ```typescript
   const response = await loginWithEmail(email, password);
   // Token automatically stored in AsyncStorage
   ```

3. **Use Token**
   ```typescript
   // All subsequent API calls automatically include token
   const collections = await getAllCollections();
   ```

4. **Refresh Token**
   ```typescript
   const response = await refreshAuthToken();
   ```

5. **Logout**
   ```typescript
   await logoutUser();
   // Tokens automatically cleared
   ```

## 🚀 Usage in React Components

### Example: Login Page
```typescript
import React, { useState } from 'react';
import { loginWithEmail } from '@/service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await loginWithEmail(email, password);
      if (response.success) {
        // Navigate to home
        router.push('/');
      } else {
        // Show error
        Alert.alert('Error', response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // UI code
  );
}
```

### Example: Collections List
```typescript
import React, { useEffect, useState } from 'react';
import { getAllCollections, type Collection } from '@/service';

export default function CollectionsScreen() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const response = await getAllCollections(1, 10);
    if (response.success && response.data) {
      setCollections(response.data.data);
    }
    setLoading(false);
  };

  return (
    // UI code
  );
}
```

## ⚠️ Error Handling

All API calls return `ApiResponse<T>`:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
```

**Check success before using data:**
```typescript
const response = await createCollection(data);

if (response.success) {
  console.log('Collection created:', response.data);
} else {
  console.error('Error:', response.message);
}
```

## 🔄 Adding New Services

To add a new service (e.g., `payments.service.ts`):

1. **Create the service file**
   ```typescript
   // service/payments.service.ts
   import { ApiResponse } from './types';
   
   export const createPayment = async (data: any) => {
     // Implementation
   };
   ```

2. **Export from index**
   ```typescript
   // service/index.ts
   export * from './payments.service';
   ```

3. **Use in components**
   ```typescript
   import { createPayment } from '@/service';
   ```

## 📞 Support

For API endpoint details, see `API_DOCUMENTATION.md` in the root directory.

For setup and configuration, see `MYSQL_SETUP.md`.

## 🎯 Best Practices

1. ✅ Always import from `@/service` (the index)
2. ✅ Check `response.success` before using data
3. ✅ Handle errors gracefully
4. ✅ Use TypeScript types for type safety
5. ✅ Keep services focused and single-purpose
6. ✅ Update config with your backend URL
7. ✅ Don't commit real API keys in code
8. ✅ Use environment variables for secrets

## 📝 Notes

- All API calls include JWT token automatically (when authenticated)
- Tokens are stored securely in AsyncStorage
- 401 responses trigger logout and token clearing
- All endpoints follow REST conventions
- Responses use consistent ApiResponse format
- All functions are async/await compatible

---

**Service Layer Ready! 🚀**

Start importing from `@/service` in your components.
