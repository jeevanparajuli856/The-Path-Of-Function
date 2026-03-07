# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Path of Function** is an educational visual novel built with Ren'Py 8.4.1, designed to teach CSCI 2000 students about Python functions. The project has three components:

1. **Ren'Py game** (`game/`) — the core interactive visual novel
2. **FastAPI backend** (`backend/`) — research data collection, student access codes, Vertex AI chat
3. **Next.js frontend** (`frontend/`) — web wrapper, admin portal, student code-entry, game iframe container

## Running the Project

### Ren'Py Game (development)
Open the project root in the Ren'Py launcher and click "Launch Project". The game entry point is `game/script.rpy`.

To build the web distribution: use Ren'Py launcher > Web > Build. The output goes to `ThePathofFunction_dist_Web/`.

### Backend (FastAPI)
```bash
cd backend
# Activate venv
.venv\Scripts\activate          # Windows
# Run dev server
uvicorn app.main:app --reload --port 8000
```
Dependencies: `pip install -r requirements.txt` (Python 3.11+)

API docs available at `http://localhost:8000/docs` when `ENVIRONMENT=development`.

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev       # development server
npm run build     # production build
npm run lint      # ESLint
```

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

### Backend Structure (`backend/app/`)

```
app/
  main.py          — FastAPI app, middleware, router registration
  core/
    config.py      — settings via pydantic-settings
    database.py    — async SQLAlchemy engine init/close
    security.py    — JWT + password hashing
  api/
    admin.py       — /api/admin/* (code generation, CSV export, dashboard)
    student.py     — /api/student/* (code validation, session start)
    game.py        — /api/game/event (gameplay event logging)
    chat.py        — /api/chat/ask (Vertex AI grounded chat)
  models/          — SQLAlchemy ORM models (admin, code, session, event, chat, system)
  schemas/         — Pydantic request/response schemas (admin, student, game, chat)
  services/
    vertex_ai.py   — Vertex AI RAG integration
  middleware/
    auth.py        — JWT auth middleware
    rate_limit.py  — rate limiting (slowapi)
```

API route groups:
- `POST /api/student/validate-code` + `POST /api/student/start-session`
- `POST /api/game/event` — receives Ren'Py telemetry events
- `POST /api/chat/ask` — Vertex-grounded chat with spoiler guard
- `POST /api/admin/codes/generate` — generate access codes

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

Core tables: `access_codes`, `code_batches`, `game_sessions`, `game_events`, `chat_messages`, `chat_citations`, `vertex_traces`

Session flow: code validated -> session created with `session_token` -> all subsequent events use only `session_token` (never raw code again). Student identity is anonymous by design; professor maps code -> name externally.

## Key Conventions

- `game_Backup/` is a manual backup of the game directory — do not treat it as source of truth.
- `ThePathofFunction_dist_Web/` is the built web distribution — generated artifact, not hand-edited.
- Character `a` (Emma/ale) sprite commands follow the pattern: `show ale <category> <variant> at <position> with <transition>`.
- Each scene file is a separate `.rpy` file called via `call` from `script.rpy`; scenes `return` control back.
- The drag-and-drop puzzle uses a global `dropBoxStates` dict initialized in `init python:` — correct answer requires `box1=optC1` through `box5=optC5`.
- `config.allow_skipping = False` is intentional (educational integrity).
- Backend `ENVIRONMENT` variable controls: dev docs exposure, debug routes, reload mode.

## Known Issues

- `game/SceneScript/teaching1.rpy` line 279 has a syntax error: `at` clause on a `say` statement. Fix by separating `show` and dialogue onto separate lines.
- Character positioning (`aleAlign`) is defined inconsistently across scene files with different x/y values.
- `dragNDropFirst.rpy` has an unused global `counter` variable alongside a separate `count` variable.
