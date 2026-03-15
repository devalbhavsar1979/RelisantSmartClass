# Supabase Authentication Setup Guide

This guide explains how to set up Supabase authentication for your Relisant Smart Class PWA.

## Prerequisites

- A Supabase account (https://supabase.com)
- A Supabase project created
- A `users` table with the following columns:
  - `id` (UUID, primary key)
  - `email` (TEXT, unique)
  - `hashed_password` (TEXT)
  - `name` (TEXT, optional)
  - `is_active` (BOOLEAN, default: true)
  - `created_at` (TIMESTAMP, auto)
  - `updated_at` (TIMESTAMP, auto)

## Step 1: Get Supabase Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** from the list
3. **Click Settings** (bottom left) > **API**
4. **Copy the following values:**
   - **Project URL** (labeled "Project URL")
   - **Anon/Public Key** (under "Project API keys")

## Step 2: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Important:** Never commit `.env` to version control. It's already in `.gitignore`

## Step 3: Ensure Users Table Exists

### SQL Script to Create Users Table

If your users table doesn't exist, run this SQL in the Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read (for authentication only)
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

## Step 4: Add Test User(s)

### Insert Test User via SQL

Run this in the Supabase SQL Editor to create a test user:

```sql
INSERT INTO users (email, hashed_password, name, is_active)
VALUES 
  ('test@example.com', 'password123', 'Test User', true),
  ('admin@relisantsmartclass.com', 'admin123', 'Admin User', true);
```

**⚠️ IMPORTANT:** The current implementation compares passwords as plain text.
For production, see the **Password Security** section below.

## Step 5: Test the Login

1. Build and run the app:
   ```bash
   npm run dev
   ```

2. In the browser, navigate to `http://localhost:5173`

3. Try logging in with:
   - **Email:** `test@example.com`
   - **Password:** `password123`

4. On successful login:
   - You'll be redirected to the Dashboard
   - User data is stored in `localStorage`
   - Browser dev tools → Application → LocalStorage → `user` shows the stored data

## Security Considerations

### ⚠️ Password Security - MUST FIX FOR PRODUCTION

**Current implementation:** Passwords are compared as plain text (DEV ONLY)

**Production implementation:** Use bcrypt for secure password hashing

### Two Options for Production:

#### Option 1: Backend Password Validation (Recommended)

Create a backend endpoint that validates passwords using bcrypt:

```javascript
// Backend (Node.js/Express example)
const bcrypt = require('bcrypt');

app.post('/api/authenticate', async (req, res) => {
  const { email, password } = req.body;

  // Query Supabase
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Use bcrypt to compare passwords
  const isValid = await bcrypt.compare(password, user.hashed_password);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Return user data and session token
  res.json({ user, token: generateToken(user) });
});
```

#### Option 2: Use Supabase Auth (Built-in)

Supabase provides a built-in authentication system:

```javascript
// Use Supabase Auth instead of custom table
import { supabase } from './supabaseClient';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### How to Hash Passwords Before Storing (When Creating Users)

```bash
npm install bcrypt
```

```javascript
import bcrypt from 'bcrypt';

// When creating a new user:
const hashedPassword = await bcrypt.hash(plainPassword, 10);

await supabase
  .from('users')
  .insert([{
    email: userEmail,
    hashed_password: hashedPassword,
    name: userName,
    is_active: true
  }]);
```

## File Structure

```
src/
├── services/
│   └── supabaseClient.js       # Supabase client initialization and auth functions
├── pages/
│   ├── Login.jsx               # Updated to use real authentication
│   ├── Dashboard.jsx
│   └── ...
└── App.jsx                     # Updated to handle user session

.env                            # Supabase credentials (never commit this!)
.env.example                    # Example template (safe to commit)
```

## Key Functions in `supabaseClient.js`

### `authenticateUser(email, password)`
Authenticates user against Supabase database.

```javascript
const { user, error } = await authenticateUser(email, password);
```

### `getCurrentUser()`
Retrieves logged-in user from localStorage.

```javascript
const user = getCurrentUser();
```

### `saveUserToStorage(user)`
Saves user object to localStorage.

```javascript
saveUserToStorage(user);
```

### `clearUserFromStorage()`
Clears user data on logout.

```javascript
clearUserFromStorage();
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:** 
1. Check that `.env` file exists
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart the dev server

### Issue: "Invalid email or password" for valid credentials

**Possible causes:**
1. User `is_active` is not set to `true`
2. Email doesn't match exactly (case-sensitive)
3. Password is stored as hashed but code expects plain text
4. Database credentials in `.env` are incorrect

**Solution:** Query the Supabase database directly:

```sql
SELECT email, is_active FROM users WHERE email = 'test@example.com';
```

### Issue: Login works but user doesn't persist after refresh

**Solution:** Check browser localStorage:
1. Open DevTools → Application → LocalStorage
2. Verify `isLoggedIn` and `user` keys exist
3. Check browser privacy settings aren't blocking localStorage

## Next Steps

1. ✅ Configure `.env` with your Supabase credentials
2. ✅ Create users table and add test users
3. ✅ Test login with real credentials
4. ✅ For production: Implement secure password hashing (bcrypt)
5. ✅ Deploy to production (Vercel, etc.)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [bcrypt.js Library](https://www.npmjs.com/package/bcryptjs)
