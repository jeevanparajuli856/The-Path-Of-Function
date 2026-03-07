# Agent Onboarding Notes

Last updated: 2026-03-07

## Repo Snapshot
- Project: **The Path of Function**
- Structure: monorepo-style with game + web + data + infra
- Primary areas:
  - `game/` (Ren'Py source)
  - `frontend/` (Next.js 14 app + API routes)
  - `database/` (PostgreSQL/Supabase schema)
  - `infra/` (cloud/deployment templates)

## Implemented Architecture
- Frontend: Next.js App Router + TypeScript
- Backend API: Next.js route handlers under `frontend/app/api/*`
- Database: Supabase/PostgreSQL via `@supabase/supabase-js`
- AI assistant: AWS Bedrock integration in `frontend/lib/bedrock.ts`
- State management: Zustand (`frontend/lib/store.ts`)
- Ren'Py bridge: iframe + `postMessage` utilities (`frontend/lib/renpy.ts`)

## Key Runtime Flow
1. User enters access code at `frontend/app/code-entry/page.tsx`.
2. Code validates via `/api/student/validate-code`.
3. Session starts/resumes via `/api/student/start-session` or `/api/student/resume-session`.
4. User plays in `frontend/app/game/page.tsx` with embedded Ren'Py iframe.
5. Game events log through `/api/game/event` and related endpoints.
6. Session completion/abandon handled through `/api/game/session-end`.

## Important Files
- Root docs:
  - `README.md`
  - `IMPLEMENTATION_STATUS.md`
  - `FLOW_INTEGRATION.md`
  - `RENPY_AI_DB_INTEGRATION.md`
- Frontend core:
  - `frontend/lib/api.ts`
  - `frontend/lib/store.ts`
  - `frontend/lib/renpy.ts`
  - `frontend/lib/db.ts`
- API routes:
  - `frontend/app/api/student/*`
  - `frontend/app/api/game/*`
  - `frontend/app/api/admin/*`
  - `frontend/app/api/chat/*`
- Game telemetry:
  - `game/integration_events.rpy`
  - `game/script.rpy`

## Current Caveats / Risks
- Existing unstaged local change detected in:
  - `frontend/app/admin/login/page.tsx`
- Documentation drift:
  - Some docs still mention a separate FastAPI backend, while current implementation is Next.js API routes.
- Likely path mismatch for Ren'Py web build:
  - Game page uses `/renpy-game/index.html`, docs often reference `/public/game/index.html`.
- Backup folder tracking risk:
  - Folder present as `game_Backup/`, while `.gitignore` currently lists `game_backup/` (case difference).

## Working Agreements for Future Edits
- Do not overwrite user’s existing unstaged changes without explicit request.
- Prefer changes in `frontend/app/api/*`, `frontend/lib/*`, and game telemetry files for integration work.
- Keep docs updated when changing architecture assumptions.

## Suggested First Technical Tasks
1. Align Ren'Py web build path and document exact expected location.
2. Reconcile docs to reflect Next.js route-handler backend reality.
3. Run end-to-end session + event logging verification (code entry to session end).
4. Normalize event taxonomy names across Ren'Py emits and API event persistence.
