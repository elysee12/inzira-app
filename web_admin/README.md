# Imirire Admin Console

Professional web administration portal for the Imirire Child Nutrition Platform.

## 🚀 Features

### ✅ Fully Implemented & Connected to Backend

- **Dashboard** — Platform statistics, recent content, quick actions
- **Lessons Management** — CRUD for nutrition content with file upload support (PDF, DOCX, audio, video)
- **Age Categories** — Customize age groups with colors, descriptions, and images
- **CHW Management** — Create/edit Community Health Workers with auto-generated passwords & welcome emails
- **Parent Management** — View/manage parent accounts with village-based CHW assignment
- **Messages** — Real-time monitoring of CHW ↔ Parent conversations
- **Authentication** — Secure login with JWT tokens
- **Location Picker** — Full Rwanda administrative hierarchy (Province → District → Sector → Cell → Village)
- **Dark Mode** — Toggle between light/dark themes
- **Responsive** — Mobile-friendly with slide-out sidebar

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite + TanStack Router (file-based routing)
- **State:** TanStack Query v5 (server state) + React Context (auth)
- **UI:** Tailwind CSS v4 + shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Notifications:** Sonner (toast)
- **API:** Fetch-based client with automatic JWT header injection

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend running on `http://localhost:3000` (NestJS server)
- MySQL database with Prisma migrations applied

## 🚦 Getting Started

### 1. Install Dependencies

```bash
cd web_admin
npm install
```

### 2. Environment Setup

Create `.env` file (already exists):

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173` (or next available port).

### 4. Login

Default admin credentials (must exist in database):

- **Email:** Your admin account email
- **Password:** Your admin password

The backend must have at least one user with `role = 'ADMIN'`.

## 📁 Project Structure

```
web_admin/
├── src/
│   ├── assets/               # Static assets
│   │   └── rwanda_locations.json
│   ├── components/
│   │   ├── admin/            # Admin-specific components
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminTopbar.tsx
│   │   │   ├── MobileSidebar.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── UserManager.tsx
│   │   │   └── ui.tsx
│   │   └── ui/               # shadcn/ui components (40+)
│   ├── lib/
│   │   ├── api.ts            # API client & types (✅ real backend calls)
│   │   ├── auth-context.tsx  # Authentication context
│   │   └── utils.ts          # cn() helper
│   ├── routes/
│   │   ├── __root.tsx        # Root layout with QueryClient & AuthProvider
│   │   ├── index.tsx         # Redirects to /dashboard
│   │   ├── login.tsx         # Login page
│   │   ├── _admin.tsx        # Admin layout with auth guard
│   │   ├── _admin.dashboard.tsx
│   │   ├── _admin.lessons.tsx
│   │   ├── _admin.categories.tsx
│   │   ├── _admin.chws.tsx
│   │   ├── _admin.parents.tsx
│   │   └── _admin.messages.tsx
│   ├── styles.css            # Tailwind + theme variables
│   ├── router.tsx            # Router setup
│   └── routeTree.gen.ts      # Generated route tree
├── .env                      # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔌 API Integration

All API calls in `src/lib/api.ts` are **fully wired to the real backend**:

### Endpoints Used

| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| **Auth** | `/api/auth/login` | POST | Login with email + password |
| **Users** | `/api/users` | GET | List all users |
| | `/api/users/:id` | GET | Get single user |
| | `/api/users/by-role?role=X` | GET | Filter by role |
| | `/api/users/stats` | GET | User statistics |
| | `/api/users/:id` | PATCH | Update user |
| | `/api/users/:id` | DELETE | Delete user |
| **CHWs** | `/api/chw` | GET/POST | List/Create CHWs |
| | `/api/chw/:id` | GET/PUT/DELETE | CRUD operations |
| | `/api/chw/:id/parents` | GET | Get assigned parents |
| **Content** | `/api/content` | GET/POST | List/Create lessons |
| | `/api/content/:id` | GET/PATCH/DELETE | CRUD operations |
| **Categories** | `/api/age-categories` | GET/POST | List/Create categories |
| | `/api/age-categories/:id` | GET/PATCH | Get/Update category |
| **Messages** | `/api/messages/conversations/:userId` | GET | List conversations |
| | `/api/messages/conversation` | GET | Get thread |
| | `/api/messages` | POST | Send message |
| | `/api/messages/unread/:userId` | GET | Unread count |

### File Uploads

File uploads use `multipart/form-data`:

- **Content files:** `/api/content` with `file` field (PDF, DOCX, audio, video)
- **Category images:** `/api/age-categories` with `image` field

Uploaded files are stored in `backend/uploads/` and served at `/uploads/:filename`.

## 🎨 Theming

The app uses **CSS custom properties** for theming. Toggle dark mode via the topbar moon/sun icon.

Theme variables are defined in `src/styles.css`:

```css
:root {
  --primary: oklch(0.52 0.16 245);        /* Deep ocean blue */
  --success: oklch(0.65 0.16 150);        /* Green */
  --warning: oklch(0.78 0.15 75);         /* Yellow */
  --destructive: oklch(0.6 0.22 25);      /* Red */
  /* ... */
}

.dark {
  --primary: oklch(0.7 0.15 240);
  /* ... */
}
```

## 🔒 Authentication Flow

1. User enters email + password on `/login`
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials and returns JWT:
   ```json
   {
     "access_token": "eyJhbGc...",
     "user": { "id": 1, "name": "Admin", "email": "...", "role": "ADMIN" }
   }
   ```
4. Frontend stores token in `localStorage` as `admin_token`
5. All subsequent API calls include `Authorization: Bearer <token>` header
6. Route guard in `_admin.tsx` redirects to `/login` if no token

## 🌍 Rwanda Location Picker

The `LocationPicker` component provides a cascading dropdown for Rwanda's administrative divisions:

**Hierarchy:** Province → District → Sector → Cell → Village

**Data source:** `src/assets/rwanda_locations.json` (14,837 villages across 5 provinces)

**Usage:**
```tsx
import { LocationPicker, type LocationValue } from "@/components/admin/LocationPicker";

const [location, setLocation] = useState<LocationValue>({});

<LocationPicker value={location} onChange={setLocation} required />
```

## 📊 Dashboard Statistics

The dashboard fetches real-time stats:

- **Content:** Document/audio/video counts from `/api/content`
- **Users:** Parent/CHW counts from `/api/users/stats`
- **Categories:** Count from `/api/age-categories`

Charts use **Recharts** library (already configured via shadcn/ui).

## 🐛 Troubleshooting

### Backend Connection Errors

**Error:** `Failed to load lessons. Is the backend running?`

**Solution:**
1. Verify backend is running: `cd backend && npm run start:dev`
2. Check it's accessible: `curl http://localhost:3000/api/content`
3. Verify `.env` has correct `VITE_API_BASE_URL`

### CORS Issues

**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:** Backend already has CORS enabled (`origin: '*'` in `main.ts`). Restart backend if needed.

### Login Fails with 401

**Causes:**
- Invalid credentials
- No admin user in database
- Backend not running

**Solution:**
```sql
-- Check if admin user exists
SELECT * FROM User WHERE role = 'ADMIN';

-- Create admin user (hash password first)
INSERT INTO User (email, phone, password, name, role) 
VALUES ('admin@imirire.rw', '0781234567', '$2b$10$...', 'Admin', 'ADMIN');
```

### File Upload Fails

**Error:** `413 Request Entity Too Large`

**Solution:** Increase NestJS body size limit in `main.ts`:
```ts
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));
```

### Village-based CHW Assignment Not Working

**Issue:** Parents don't show assigned CHW

**Cause:** Village names don't match exactly (case-sensitive!)

**Solution:** Ensure both CHW and Parent have **identical** village names:
```sql
-- Check villages
SELECT id, name, role, village FROM User WHERE role IN ('CHW', 'PARENT');

-- Should match exactly: "Amahoro" = "Amahoro" ✅, "Amahoro" ≠ "amahoro" ❌
```

## 📦 Build for Production

```bash
npm run build
```

Output: `dist/` folder

Serve with:
```bash
npm run preview
```

Or deploy to:
- Vercel / Netlify (static hosting)
- AWS S3 + CloudFront
- Your own server with nginx

Update `.env` for production:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 🔄 Development Workflow

### Adding a New Page

1. Create route file: `src/routes/_admin.newpage.tsx`
2. Update `src/routeTree.gen.ts` (add import and route config)
3. Add navigation link in `src/components/admin/AdminSidebar.tsx`
4. Add title in `src/components/admin/AdminTopbar.tsx`

### Adding a New API Endpoint

1. Define types in `src/lib/api.ts`
2. Add function to relevant API object (`contentApi`, `userApi`, etc.)
3. Use in component with TanStack Query:
   ```tsx
   const { data } = useQuery({
     queryKey: ['myData'],
     queryFn: myApi.fetch,
   });
   ```

## 🎯 Key Features Explained

### Real-time Message Monitoring

The Messages page (`_admin.messages.tsx`) polls conversations every 5 seconds:

```tsx
const thread = useQuery({
  queryKey: ["thread", userId, otherId],
  queryFn: () => messageApi.conversation(userId, otherId),
  refetchInterval: 5000, // ← Auto-refresh
});
```

### Auto-generated CHW Passwords

When creating a CHW, the backend:
1. Generates a secure 10-character password
2. Hashes it with bcrypt
3. Sends a welcome email via Brevo
4. Returns the plain password to admin (displayed once in modal)

### File Upload with Preview

Lessons and categories support file uploads:

```tsx
const form = new FormData();
form.append("title", "My Lesson");
form.append("file", fileBlob);

const content = await contentApi.create(data, fileBlob);
```

Backend auto-extracts text from PDFs and DOCX files.

## 🤝 Contributing

1. Follow existing code style (Prettier + ESLint configured)
2. Use TypeScript strictly (no `any` unless absolutely necessary)
3. Test with real backend before committing
4. Update this README if adding major features

## 📄 License

This project is part of the Imirire Child Nutrition Platform.

---

**Built with ❤️ using Lovable.dev, React 19, and TanStack Router**
