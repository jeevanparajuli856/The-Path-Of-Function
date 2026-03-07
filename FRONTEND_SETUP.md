# Path of Function - Vercel Frontend Setup Guide

## 🚀 Quick Start

### 1. Initialize Next.js Project
```bash
cd frontend
npm install
npm run dev
```

Server will run on: `http://localhost:3000`

---

## 📁 Directory Structure to Create

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home / Landing page
│   ├── game/
│   │   └── page.tsx        # Main game interface
│   ├── code-entry/
│   │   └── page.tsx        # Code validation page
│   └── admin/
│       ├── page.tsx        # Admin dashboard
│       ├── login/
│       │   └── page.tsx    # Admin login
│       └── codes/
│           └── page.tsx    # Code management
├── components/
│   ├── GameWindow.tsx      # Main game container
│   ├── SceneRenderer.tsx   # Ren'Py scene display
│   ├── DialogueBox.tsx     # Character dialogue
│   ├── ChoiceButtons.tsx   # Player choices
│   ├── CodeEntry.tsx       # Code input form
│   └── CheckpointCodeEntry.tsx  # Checkpoint code entry
├── lib/
│   ├── api.ts              # API client
│   ├── hooks/
│   │   ├── useSession.ts   # Session management
│   │   ├── useAPI.ts       # API calls
│   │   └── useRenpyProxy.ts # Ren'Py communication
│   └── store.ts            # State management (Zustand/Jotai)
├── types/
│   └── index.ts            # TypeScript interfaces
├── public/
│   └── images/             # Game assets
├── styles/
│   └── globals.css         # Tailwind + custom styles
├── .env.local              # Environment variables
├── next.config.js          # Next.js config (created ✓)
├── package.json            # Dependencies (created ✓)
├── tsconfig.json           # TypeScript config
└── tailwind.config.js      # Tailwind CSS config
```

---

## 🔧 Key Implementation Files

### 1. **API Client** (`lib/api.ts`)
```typescript
// Axios instance configured for backend
// Handle session tokens, JWT auth, error responses

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

// Interceptors for token management
// Methods for: validateCode(), startSession(), logEvent(), 
//   verifyCheckpoint(), endSession()
```

### 2. **Game State** (`lib/store.ts`)
```typescript
// Zustand store for:
// - sessionToken, sessionId, currentScene
// - playerChoices, quizAnswers, checkpointPasses
// - eventBuffer (for offline replay)
// - authToken, adminUser

export const useGameStore = create(...)
export const useAdminStore = create(...)
```

### 3. **Main Game Component** (`components/GameWindow.tsx`)
- Renders current Ren'Py scene
- Handles dialogue/choice display
- Manages event logging
- Tracks checkpoint codes
- Supports offline buffering

### 4. **Code Entry Page** (`app/code-entry/page.tsx`)
- Form: Validate access code
- Shows: Treatment group, session info
- Starts game session
- Stores JWT token

### 5. **Admin Dashboard** (`app/admin/page.tsx`)
- Login with admin credentials
- View code batches
- Generate new codes
- View analytics (completion rates, quiz scores)

---

## 🔌 Ren'Py Integration

The game runs as a **Ren'Py web build** embedded in an iframe or alongside React components.

### Communication Flow:
1. **Ren'Py → React**: Events via `window.postMessage()`
2. **React → Ren'Py**: Commands via iframe API or URL params
3. **React ↔ Backend**: API calls for persistence

```typescript
// In Ren'Py (Python):
ren.call_js("window.parent.postMessage({type: 'event', data}, '*')")

// In React (TypeScript):
window.addEventListener('message', (e) => {
  if (e.data.type === 'event') {
    handleRenpyEvent(e.data.data)
  }
})
```

---

## 📌 Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://fcnvhyecdnpsmttayhyq.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=sb_publishable_OrVXxeGGgsJez225vPd5hg_VG6VivMi

# For Vercel deployment:
VERCEL_ENV=production
```

---

## 🚢 Deployment to Vercel

### 1. Connect GitHub Repository
```bash
# Push frontend to GitHub
cd frontend
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import Project in Vercel
- Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- Click "New Project"
- Select GitHub repo
- Configure:
  - **Root Directory**: `frontend/`
  - **Build Command**: `npm run build`
  - **Install Command**: `npm install`
  - **Output Directory**: `.next`

### 3. Set Environment Variables in Vercel
```
NEXT_PUBLIC_API_BASE_URL=https://backend-api.vercel.app/api
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_KEY=...
```

---

## 📝 Game Flow

1. **Landing Page** (`/`)
   - Intro text
   - Button: "Enter Access Code"

2. **Code Entry** (`/code-entry`)
   - Input code
   - Validate via backend
   - Receive session token

3. **Game** (`/game`)
   - Load Ren'Py scene
   - Render dialogue/choices
   - Log events to backend
   - Handle checkpoints (hardcoded codes: FUNC123, FUNC456)

4. **Post-Game**
   - End session
   - Show completion summary
   - Send final data to backend

---

## 🎯 Backend API Endpoints Used

```
POST   /student/validate-code
POST   /student/start-session
POST   /game/event
POST   /game/events/batch
POST   /game/checkpoint
POST   /admin/login
GET    /admin/dashboard/summary
```

---

## ✅ Testing Checklist

- [ ] Code validation works
- [ ] Session starts successfully
- [ ] Events logged to database
- [ ] Checkpoint verification works
- [ ] Admin dashboard displays analytics
- [ ] Offline event buffering works
- [ ] Ren'Py integration smooth
- [ ] Mobile responsive design

---

## 📚 Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Ren'Py Web**: https://www.renpy.org/doc/html/web.html
- **Vercel Docs**: https://vercel.com/docs

---

## 🔄 Next Steps

1. Run `npm install` in frontend directory
2. Create TypeScript config and Tailwind
3. Build out API client with proper error handling
4. Implement game state management
5. Create React components for game UI
6. Integrate Ren'Py web build
7. Deploy to Vercel

**Backend Server Status**: ✅ Running on `http://localhost:8000`
**Swagger Docs**: http://localhost:8000/docs
