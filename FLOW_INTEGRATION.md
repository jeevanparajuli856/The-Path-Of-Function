# Complete Flow: Code Entry -> Game -> Telemetry -> Chat

## Overview

This is the canonical runtime flow for the current implementation.

1. Student enters code at `/code-entry`.
2. Frontend validates code via `/api/student/validate-code`.
3. Frontend starts or resumes a session via `/api/student/start-session` or `/api/student/resume-session`.
4. Game page loads Ren'Py iframe from `/renpy-game/index.html`.
5. Ren'Py emits telemetry events through `window.sendToFrontend(type, payload)`.
6. Frontend logs events to `/api/game/event`.
7. Chat overlay sends user message + latest game context to `/api/chat/ask`.
8. On `game_ended`, frontend marks session complete via `/api/game/session-end`.

Important:
- `request_checkpoint_code` is analytics-only in this flow.
- Frontend auto-acknowledges checkpoint events and does not block gameplay.

## Event Logging Contract

Frontend logs the Ren'Py event type directly as `event_type`.

Common events:
- `scene_start`
- `dialogue`
- `choice_made`
- `learning_context_update`
- `help_policy_update`
- `player_state_update`
- `quiz_started`
- `quiz_submitted`
- `checkpoint_reached`
- `request_checkpoint_code`
- `game_ended`
- `error`

Legacy event types are still accepted in DB for compatibility, but new telemetry above is canonical.

## Chat Context Contract

`POST /api/chat/ask` receives:
- `session_token`
- `message`
- `context` with latest known:
  - `scene_id`
  - `topic_id`
  - `learning_objective`
  - `help_policy`
  - `player_state`

This context is derived from live Ren'Py events in the game page.

## Ren'Py Build Path

Expected static path:
- `frontend/public/renpy-game/index.html`

If missing, game page now shows a visible setup error with instructions.

## API Base Behavior

Default frontend API base is internal Next route handlers:
- `/api`

External backend URLs can still be used by setting:
- `NEXT_PUBLIC_API_BASE_URL`
