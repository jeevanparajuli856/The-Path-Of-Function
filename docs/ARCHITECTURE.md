# Architecture

## Stack
- Ren'Py game source: `game/`
- Web app + APIs: Next.js 14 App Router in `frontend/`
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- AI tutor: AWS Bedrock (`frontend/lib/bedrock.ts`)

## Runtime Flow
1. Student enters access code on `/code-entry`.
2. Frontend validates code and starts/resumes a session via `/api/student/*`.
3. Game page loads Ren'Py web build from `frontend/public/renpy-game/index.html`.
4. Ren'Py emits telemetry via `window.sendToFrontend(type, payload)`.
5. Frontend logs events to `/api/game/event`.
6. Chat overlay calls `/api/chat/ask` with latest scene/context.
7. On game end, final code verification is required, then session is closed.

## Important Behavior
- Chat icon is available from `hallway` scene onward.
- Chat is hidden during active prompts/quizzes.
- During active assessments, Emma gives hints only (no exact answer reveal).

## Key Paths
- Frontend UI: `frontend/app/*`
- API routes: `frontend/app/api/*`
- Ren'Py bridge/event client: `frontend/lib/renpy.ts`
- Chat policy/model routing: `frontend/lib/bedrock.ts`
- DB schema SQL: `database/`
