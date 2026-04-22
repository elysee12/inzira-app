# Imirire App - Database Setup Guide

## 🔧 Quick Setup

### Step 1: Initialize Database
Run this command from the backend folder:

```bash
cd d:\project\imirire-app\backend
npx prisma db push
npx ts-node prisma/seed.ts
```

### Step 2: Verify Setup
You should see:
```
Seeding database...
Admin user created: admin@imirire.rw
Age categories seeded successfully.
Seeding finished.
```

### Step 3: Test Login
Use these credentials to login:
- **Email:** admin@imirire.rw
- **Password:** Admin@123

---

## ✅ What's Fixed

### 1. **401 Unauthorized Error**
- **Issue:** No test users in database
- **Fix:** Seed includes `admin@imirire.rw` with password `Admin@123`

### 2. **Error Messages**
- **Before:** Technical "AxiosError" messages visible to users
- **After:** User-friendly Kinyarwanda messages via system Alerts
  - Invalid credentials → "Imeli cyangwa ijambo ry'ibanga si ryo"
  - User not found → "Nta konti ifite iyi imeli"

### 3. **Error Display**
- **Before:** Red error boxes on login form
- **After:** Standard system Alerts (cleaner UX)
- Applied to: Login, Register, and all auth screens

---

## 📝 Test Accounts

### Admin
- Email: `admin@imirire.rw`
- Password: `Admin@123`
- Role: Admin

You can add parent accounts through the register screen.

---

## 🐛 Troubleshooting

### "tsconfig.json not found"
Make sure you are in the `imirire-app/backend` folder:
```bash
npm install -g ts-node
```

### Database connection fails
Verify `.env` has correct DATABASE_URL:
```env
DATABASE_URL="mysql://user:password@localhost:3306/imirire"
```

### Permission denied on Windows
Use Git Bash or WSL instead of PowerShell for npm commands.

---

## 📚 Additional Resources
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [React Native Docs](https://reactnative.dev)
