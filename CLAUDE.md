# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Path of Function** is an educational visual novel built with Ren'Py 8.4.1, designed to teach CSCI 2000 students about Python functions. The project has two components:

1. **Ren'Py game** (`game/`) — the core interactive visual novel
2. **Next.js frontend** (`frontend/`) — web wrapper, admin portal, student code-entry, game iframe container, and all API routes (serverless, Vercel)

## Running the Project

### Ren'Py Game (development)
Open the project root in the Ren'Py launcher and click "Launch Project". The game entry point is `game/script.rpy`.

To build the web distribution: use Ren'Py launcher > Web > Build. The output goes to `ThePathofFunction_dist_Web/`.

### Frontend + API (Next.js)
```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase + AWS + JWT values
npm install
npm run dev       # development server on :3000 (includes all API routes)
npm run build     # production build
npm run lint      # ESLint
```

No separate backend process. All API routes live at `frontend/app/api/`.

## Architecture

### Ren'Py Game Structure

Scene flow defined in `game/script.rpy`:
```
label start:
  call inbed          -> game/SceneScript/BeforeWakeup.rpy   (nightmare + morning)
  call hallway        -> game/SceneScript/hallwayscene.rpy    (Kevin meets Emma)
  call hallwayafter   -> game/SceneScript/hallwayafter.rpy   (transition to lab)
  call teachingfirst  -> game/SceneScript/teaching1.rpy      (built-in + user-defined functions)
  call teachingSecond -> game/SceneScript/teaching2.rpy      (main() + drag-drop puzzle)
  -> game/FrameNFunction/dragNDropFirst.rpy                  (drag-and-drop challenge)
  -> game/SceneScript/afterSubmission.rpy                    (call stack + ending)
```

Key files:
- `game/script.rpy` — character definitions (`k=Kevin`, `a=Emma`, `t=Teacher`), scene orchestration
- `game/options.rpy` — game config (resolution 1920x1080, fonts, transitions, `config.allow_skipping = False`)
- `game/screens.rpy` — UI screen definitions
- `game/gui.rpy` — GUI styling (fonts: comicsecond.ttf, androgyne.otf, disposable.ttf)
- `game/FrameNFunction/dragNDropFirst.rpy` — drag-and-drop puzzle with `DragGroup`, `dropBoxStates` dict, `dragged_func()`, `submission()`
- `game/FrameNFunction/notification.rpy` — `screen notiGuide(chance)` — timed 3s wrong-answer notification

Character sprites are in `game/images/ale package/` with subdirectories for expression categories (speaking, explaining, question, sad, standing, other).

### API Routes Structure (`frontend/app/api/`)

All routes are Next.js App Router route handlers (serverless on Vercel):

```
app/api/
  student/
    validate-code/route.ts   — POST: look up code in Supabase
    start-session/route.ts   — POST: create game_session, return session_token
    resume-session/route.ts  — POST: find active session, return token
  game/
    event/route.ts           — POST: log single gameplay event
    events/batch/route.ts    — POST: bulk insert up to 100 events
    checkpoint/route.ts      — POST: verify checkpoint code
    session-end/route.ts     — POST: mark session complete/abandoned
    session/progress/route.ts — GET: session progress summary
  chat/
    ask/route.ts             — POST: Bedrock-grounded chat, logs to chat_logs
    history/route.ts         — GET: fetch chat history for session
  admin/
    login/route.ts           — POST: bcrypt verify + sign JWT
    logout/route.ts          — POST: client-side discard (returns 200)
    generate-codes/route.ts  — POST: create batch + N access_codes
    batches/route.ts         — GET: list batches with usage counts
    dashboard/
      summary/route.ts             — GET: aggregate stats
      treatment-comparison/route.ts — GET: view query
    export/
      codes/route.ts         — GET: CSV export
      analytics/route.ts     — GET: JSON sessions + events export
```

Shared lib (`frontend/lib/`):
- `db.ts` — Supabase admin client
- `jwt.ts` — `signAdminToken` / `verifyAdminToken` via `jose`
- `access-codes.ts` — `generateAccessCode()` / `validateCodeFormat()`
- `bedrock.ts` — RAG corpus, guardrails, Bedrock invocation, `generateAIResponse()`
- `api-middleware.ts` — `requireAdmin()` guard for admin routes

### Frontend Structure (`frontend/`)

Next.js 14 App Router with TypeScript + Tailwind CSS:
```
app/
  page.tsx            — landing page
  layout.tsx          — root layout
  code-entry/page.tsx — student code entry
  game/page.tsx       — game iframe + chat overlay + event bridge
  admin/
    login/page.tsx    — admin login
    page.tsx          — admin dashboard (code gen, CSV export, analytics)
```

State management: Zustand + Jotai. HTTP: axios. Animations: framer-motion.

### Ren'Py <-> Frontend Communication

The web build uses `window.postMessage()` for bidirectional communication.

**Ren'Py emits** (via `window.sendToFrontend`):
- `scene_start`, `dialogue`, `choice_made`, `quiz_started`, `quiz_submitted`, `game_ended`
- `learning_context_update`, `player_state_update`, `help_policy_update`

**Frontend forwards** gameplay events to `POST /api/game/event` with `session_token` + payload.

The JS bridge must be injected into `ThePathofFunction_dist_Web/index.html`:
```html
<script>
window.addEventListener('message', function(event) { ... });
window.sendToFrontend = function(type, payload) {
  window.parent.postMessage({ type: type, payload: payload || {} }, '*');
};
</script>
```

### Database Schema (Supabase / PostgreSQL)

Core tables: `admin_users`, `code_batches`, `access_codes`, `game_sessions`, `event_logs`, `quiz_attempts`, `checkpoint_verifications`, `audit_logs`, `research_configs`, `chat_logs`, `content_corpus`

Session flow: code validated → session created with `session_token` (UUID v4) → all subsequent events use only `session_token` (never raw code again). Student identity is anonymous by design; professor maps code → name externally.

## Key Conventions

- `game_Backup/` is a manual backup of the game directory — do not treat it as source of truth.
- `ThePathofFunction_dist_Web/` is the built web distribution — generated artifact, not hand-edited.
- Character `a` (Emma/ale) sprite commands follow the pattern: `show ale <category> <variant> at <position> with <transition>`.
- Each scene file is a separate `.rpy` file called via `call` from `script.rpy`; scenes `return` control back.
- The drag-and-drop puzzle uses a global `dropBoxStates` dict initialized in `init python:` — correct answer requires `box1=optC1` through `box5=optC5`.
- `config.allow_skipping = False` is intentional (educational integrity).

## Known Issues

- `game/SceneScript/teaching1.rpy` line 279 has a syntax error: `at` clause on a `say` statement. Fix by separating `show` and dialogue onto separate lines.
- Character positioning (`aleAlign`) is defined inconsistently across scene files with different x/y values.
- `dragNDropFirst.rpy` has an unused global `counter` variable alongside a separate `count` variable.
