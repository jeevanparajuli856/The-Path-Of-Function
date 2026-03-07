# Frontend Project Structure

## Root Files
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS theme
- `postcss.config.js` - PostCSS configuration for Tailwind
- `.env.local` - Local environment variables
- `.env.example` - Example environment variables
- `.gitignore` - Git ignore patterns

## Directories

### `/app` - Next.js App Router
- `layout.tsx` - Root layout with providers
- `page.tsx` - Home page (landing)
- `code-entry/page.tsx` - Code entry page
- `game/page.tsx` - Main game page
- `admin/login/page.tsx` - Admin login page
- `admin/page.tsx` - Admin dashboard (TODO)

### `/components` - Reusable React Components
- `GameWindow.tsx` - Ren'Py game container
- `SceneRenderer.tsx` - Scene display component
- `DialogueBox.tsx` - Character dialogue component
- `ChoiceButtons.tsx` - Player choice buttons
- `CodeEntry.tsx` - Code input component
- `CheckpointCodeEntry.tsx` - Checkpoint verification component
- `Header.tsx` - Navigation header
- `Footer.tsx` - Footer component
- `Toast.tsx` - Toast notification wrapper

### `/lib` - Utilities and Helpers
- `api.ts` - Axios client and API methods
  - `adminAPI` - Admin endpoints
  - `studentAPI` - Student endpoints
  - `gameAPI` - Game endpoints
  - Type definitions for all API responses
- `store.ts` - Zustand state management
  - `useGameStore` - Game state (session, progress, events)
  - `useAdminStore` - Admin state (authentication, batches)
- `utils.ts` - Helper functions (if needed)
- `constants.ts` - App constants (if needed)

### `/styles` - CSS and Styling
- `globals.css` - Global styles with Tailwind and utilities
- [Additional component styles as needed]

### `/public` - Static Assets
- Images, icons, and static files

## Key Features Implemented

### 1. API Client (`lib/api.ts`)
- Axios instance with interceptors
- Token management (localStorage)
- All endpoint methods documented
- Type-safe responses
- Error handling

### 2. State Management (`lib/store.ts`)
- Game session tracking
- Player progress tracking
- Event queue for offline support
- Admin authentication
- Data persistence with localStorage

### 3. Pages
- **Home** - Landing page with CTA
- **Code Entry** - Validate and start game session
- **Game** - Main game interface with Ren'Py iframe
- **Admin Login** - Research team authentication

### 4. Styling
- Dark theme with Tailwind CSS
- Responsive design
- Component utility classes
- Custom animations

## Development Workflow

### Start Development Server
```bash
cd frontend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
1. Connect GitHub repository
2. Set environment variables
3. Trigger deployment
4. Auto-deploys on push to main

## Environment Variables

### Development (`.env.local`)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

### Production (Vercel Dashboard)
Update API URL to production domain:
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

## Component Hierarchy
```
RootLayout
├── Home
├── CodeEntry
├── Game
│   ├── GameWindow
│   │   └── Ren'Py iframe
│   ├── CheckpointCodeEntry
│   └── GameControls
└── Admin/Login
```

## API Communication Flow

1. **Code Entry** → `POST /student/validate-code` → `POST /student/start-session`
2. **Game Session** → `POST /game/event` (event logging)
3. **Checkpoint** → `POST /game/checkpoint` (code verification)
4. **Session End** → `POST /game/end-session` (completion)
5. **Admin** → `POST /admin/login` → `GET /admin/batches` → Dashboard

## Ren'Py Integration (Planned)

Communication via `postMessage()`:
- Ren'Py -> React: Game events, checkpoint codes
- React -> Ren'Py: Continue/restart signals

## Testing Checklist

- [ ] Code entry validation
- [ ] Session start/resume
- [ ] Event logging to database
- [ ] Checkpoint verification
- [ ] Admin login
- [ ] Admin dashboard data loading
- [ ] Session persistence (localStorage)
- [ ] Error handling and toast notifications

## Next Steps

1. Build remaining admin components
2. Implement Ren'Py web build integration
3. Full end-to-end testing
4. Deploy to Vercel
5. Configure production API domain
