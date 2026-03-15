# Supabase Authentication - Quick Reference Guide

## 🚀 What Was Implemented

Your Relisant Smart Class PWA now has **real Supabase authentication** integrated!

### Files Modified/Created:

| File | Purpose |
|------|---------|
| `src/services/supabaseClient.js` | ✅ NEW - Supabase client & auth functions |
| `src/pages/Login.jsx` | ✅ UPDATED - Real Supabase authentication |
| `src/App.jsx` | ✅ UPDATED - User session management |
| `.env` | ✅ NEW - Supabase credentials (not committed) |
| `.env.example` | ✅ NEW - Template for setup |
| `SUPABASE_SETUP.md` | ✅ NEW - Complete setup guide |

---

## ⚙️ Step 1: Get Supabase Credentials

1. Go to **https://supabase.com/dashboard**
2. Click your project
3. Go to **Settings** (bottom left) → **API**
4. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon/Public Key** → `VITE_SUPABASE_ANON_KEY`

---

## 📝 Step 2: Update .env File

Open `.env` in your project root and replace:

```env
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🗄️ Step 3: Create Users Table in Supabase

Run this SQL in **Supabase SQL Editor**:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

## 👤 Step 4: Create Test Users

Run this SQL in Supabase to add test users:

```sql
INSERT INTO users (email, hashed_password, name, is_active)
VALUES 
  ('test@example.com', 'password123', 'Test User', true),
  ('admin@relisantsmartclass.com', 'admin123', 'Admin User', true);
```

---

## 🧪 Step 5: Test Login

```bash
npm run dev
```

**Login with:**
- Email: `test@example.com`
- Password: `password123`

---

## 📚 Key Functions in `supabaseClient.js`

### `authenticateUser(email, password)`
Authenticates user against Supabase database

```javascript
const { user, error } = await authenticateUser('test@example.com', 'password123')
if (!error) {
  // User logged in successfully
}
```

### `getCurrentUser()`
Get logged-in user from localStorage

```javascript
const user = getCurrentUser()
```

### `saveUserToStorage(user)`
Save user to localStorage

```javascript
saveUserToStorage(user)
```

### `clearUserFromStorage()`
Clear user on logout

```javascript
clearUserFromStorage()
```

---

## 🔒 Important Security Notes

### ⚠️ Password Validation - FOR DEVELOPMENT ONLY

The current implementation compares passwords as **plain text**:

```javascript
const isPasswordValid = password === user.hashed_password
```

### 🚨 FOR PRODUCTION: Use Bcrypt

Install bcrypt:
```bash
npm install bcryptjs
```

**Backend endpoint (Node.js/Express):**
```javascript
const bcrypt = require('bcryptjs');

const isValid = await bcrypt.compare(plainPassword, user.hashed_password);
```

**When creating users:**
```javascript
const hashedPassword = await bcrypt.hash(plainPassword, 10);
```

---

## User Data in localStorage

On successful login, user data is stored:

```javascript
// In browser DevTools → Application → LocalStorage
{
  "user": {
    "id": "uuid...",
    "email": "test@example.com",
    "name": "Test User",
    "is_active": true
  },
  "isLoggedIn": "true"
}
```

---

## Error Handling

The login form now displays real errors:

- ❌ "Invalid email or password" - User not found or wrong password
- ❌ "Unable to connect to database" - Supabase connection error
- ❌ "An unexpected error occurred" - Other errors

---

## Troubleshooting

### "Missing Supabase environment variables"
→ Check `.env` file has correct values. Restart dev server.

### "Invalid email or password" won't work
→ Check user `is_active = true` in database
→ Verify email matches exactly
→ Check password is stored as plain text (for dev)

### User doesn't persist after refresh
→ Check browser localhost storage is enabled
→ Verify `user` and `isLoggedIn` in localStorage

---

## API Reference

### Environment Variables

```env
VITE_SUPABASE_URL       - Your Supabase Project URL
VITE_SUPABASE_ANON_KEY  - Public anonymous key (safe to expose)
```

### Database Schema

```sql
users
├── id (UUID) - Primary key
├── email (TEXT) - User email, unique
├── hashed_password (TEXT) - Password hash/plain text
├── name (TEXT) - User Name
├── is_active (BOOLEAN) - Account status
├── created_at (TIMESTAMP) - Creation date
└── updated_at (TIMESTAMP) - Last update
```

---

## Next Steps

1. ✅ Add Supabase credentials to `.env`
2. ✅ Create users table in Supabase
3. ✅ Add test users
4. ✅ Test login locally with `npm run dev`
5. ✅ For production: Implement bcrypt password validation
6. ✅ Deploy to Vercel: `vercel --prod`

---

## Deployment

When deploying to Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Click **Environment Variables**
3. Add:
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://your_project.supabase.co`
4. Add:
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `your_public_key_here`
5. Redeploy: `vercel --prod`

---

## Complete Setup Documentation

For detailed setup, see: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

---

## Support

- 📖 [Supabase Docs](https://supabase.com/docs)
- 🚀 [Supabase JS Reference](https://supabase.com/docs/reference/javascript/introduction)
- 🔐 [PostgreSQL Users Guide](https://www.postgresql.org/docs/)
