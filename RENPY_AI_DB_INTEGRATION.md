# Ren'Py + AI + DB Integration Master Guide

This document is the single source of truth for integrating the Ren'Py web game, frontend bridge, API event logging, and the Bedrock-powered helper chatbot.

## Unified Goal

Build an in-game helper chatbot that:
- appears as a native overlay over the Ren'Py iframe,
- answers only from game-grounded knowledge,
- matches game tone/persona,
- supports students without spoilers,
- logs gameplay and chat context for research and QA.

## Final Player Flow (Implemented + Required)

1. Admin generates unique access codes.
2. Student enters code once at `/code-entry`.
3. Game starts and runs with no mid-game code prompts.
4. Frontend receives Ren'Py events via `window.postMessage`.
5. Frontend forwards gameplay events to backend (`/api/game/event`).
6. Chat overlay uses latest gameplay context for grounded help.
7. Session is marked complete on `game_ended`.

Important:
- Do not gate gameplay with `request_checkpoint_code`.
- `checkpoint_reached` is analytics only.

## Architecture

- Ren'Py web build runs in iframe: `/game/index.html`.
- Communication bridge: `window.postMessage()`.
- Frontend listener sends telemetry to backend.
- Chat endpoint receives message + live game context.
- Retrieval is restricted to game-approved corpus.

## Message Contract

### Ren'Py -> Frontend (Base)

All messages:

```json
{
  "type": "event_name",
  "payload": {}
}
```

Core events:
1. `scene_start`
2. `dialogue`
3. `choice_made`
4. `quiz_started`
5. `quiz_submitted`
6. `checkpoint_reached` (optional analytics)
7. `game_ended`
8. `error` (optional)

Learning/chat context events:
1. `learning_context_update`
2. `player_state_update`
3. `help_policy_update`

### Frontend -> Ren'Py

Supported outgoing messages:
1. `continue` (rare, optional flow control)
2. `checkpoint_verified` (legacy compatibility only)

## Event Payload Examples

### `scene_start`

```json
{
  "type": "scene_start",
  "payload": {
    "scene_name": "hallway_after",
    "current_scene": "hallway_after",
    "timestamp": "2026-03-07T12:00:00Z"
  }
}
```

### `dialogue`

```json
{
  "type": "dialogue",
  "payload": {
    "character_name": "ale",
    "dialogue_text": "Hello, student!",
    "timestamp": "2026-03-07T12:00:10Z"
  }
}
```

### `choice_made`

```json
{
  "type": "choice_made",
  "payload": {
    "choice_index": 0,
    "choice_text": "I want to learn about functions",
    "scene_name": "hallway",
    "timestamp": "2026-03-07T12:01:00Z"
  }
}
```

### `quiz_submitted`

```json
{
  "type": "quiz_submitted",
  "payload": {
    "quiz_id": "q1_functions",
    "answer_selected": 0,
    "is_correct": true,
    "score": 1,
    "total": 5,
    "timestamp": "2026-03-07T12:02:00Z"
  }
}
```

### `game_ended`

```json
{
  "type": "game_ended",
  "payload": {
    "final_scene": "completion",
    "quizzes_completed": 5,
    "final_score": 85,
    "timestamp": "2026-03-07T12:30:00Z"
  }
}
```

### `learning_context_update`

```json
{
  "type": "learning_context_update",
  "payload": {
    "scene_id": "teaching1",
    "topic_id": "functions.parameters",
    "learning_objective": "Understand function parameters",
    "difficulty_level": "beginner",
    "concept_tags": ["function", "parameter", "argument"]
  }
}
```

### `player_state_update`

```json
{
  "type": "player_state_update",
  "payload": {
    "current_scene_id": "teaching1",
    "choices_made": ["choice_a1", "choice_b2"],
    "quiz_id": "q1_functions",
    "wrong_attempt_count": 2,
    "hints_used": 1,
    "time_in_scene_seconds": 84
  }
}
```

### `help_policy_update`

```json
{
  "type": "help_policy_update",
  "payload": {
    "allowed_help_level": "hint",
    "spoiler_guard": "strict"
  }
}
```

## Required Bridge in Ren'Py Web `index.html`

```html
<script>
window.addEventListener('message', function(event) {
  const message = event.data;
  window.lastFrontendMessage = message;
  window.dispatchEvent(new CustomEvent('frontend-message', { detail: message }));
});

window.sendToFrontend = function(type, payload) {
  window.parent.postMessage({ type: type, payload: payload || {} }, '*');
};
</script>
```

## Ren'Py Emission Pattern

```python
init python:
    import json

    def send_to_frontend(event_type, payload=None):
        if payload is None:
            payload = {}
        message = json.dumps({"type": event_type, "payload": payload})
        # Replace with your web-capable JS bridge call for your Ren'Py version.
        # The goal is to call window.sendToFrontend(type, payload).
```

## Chat Overlay UX Requirements

- Render chatbot as overlay panel above the game iframe.
- Use game UI tokens (font, color, borders, spacing).
- Keep panel collapsible/minimizable.
- Optional: pause or dim game while expanded.
- Center chat UI with game-themed background.
- Hide chat interaction while player must answer a question or make a choice.

## Data Requirements from Ren'Py for RAG Quality

### Stable IDs (Required)

- `scene_id`
- `dialogue_id`
- `choice_id`
- `quiz_id`
- `question_id`

Why: IDs map player context to exact knowledge chunks.

### Learning Context (Required)

- `topic_id`
- `learning_objective`
- `difficulty_level`
- `concept_tags`

### Player State (Required)

- `current_scene_id`
- `choices_made`
- `wrong_attempt_count`
- `hints_used`
- `time_in_scene_seconds`

### Help Policy (Required)

- `allowed_help_level`: `nudge | hint | explain | full`
- `spoiler_guard`: `strict | medium | off`

## API and DB Integration Contract (Research + Bedrock)

### Gameplay Event Logging

- Frontend posts events to `/api/game/event`.
- Each event should include: `session_token`, `type`, `payload`, `timestamp`.
- Backend persists event stream for analytics and reconstruction.

Recommended request body:

```json
{
  "session_token": "stu_abc123",
  "event_type": "scene_start",
  "timestamp": "2026-03-07T12:00:00Z",
  "payload": {
    "scene_id": "teaching1",
    "topic_id": "functions.parameters"
  }
}
```

### Chat Endpoint (Bedrock Grounded)

Create endpoint (example `/api/chat/ask`) that receives:
- `session_token`
- `message`
- latest context:
  - `scene_id`
  - `topic_id`
  - `help_policy`
  - `player_state`

Response should return:
- `assistant_message`
- `citations` (chunk IDs/titles)
- `applied_guardrail_mode` (`strict | medium | off`)

Recommended request body:

```json
{
  "session_token": "stu_abc123",
  "message": "I don't understand function parameters.",
  "context": {
    "scene_id": "teaching1",
    "topic_id": "functions.parameters",
    "help_policy": {
      "allowed_help_level": "hint",
      "spoiler_guard": "strict"
    },
    "player_state": {
      "wrong_attempt_count": 2,
      "hints_used": 1
    }
  }
}
```

Recommended response body:

```json
{
  "assistant_message": "Try identifying what value is passed into the function call first.",
  "applied_guardrail_mode": "strict",
  "citations": [
    {
      "chunk_id": "lesson_fn_param_03",
      "title": "Function Parameters Intro"
    }
  ]
}
```

### Research DB Schema (Recommended)

Use one `session_token` to join gameplay telemetry, chat prompts, and Vertex citation evidence.

1. `game_sessions`
  - `id` (PK)
  - `session_token` (unique)
  - `access_code_id`
  - `student_id` (nullable if anonymous)
  - `started_at`
  - `ended_at`
  - `status` (`active | completed | dropped`)

2. `game_events`
  - `id` (PK)
  - `session_id` (FK -> `game_sessions.id`)
  - `event_type`
  - `scene_id` (nullable)
  - `topic_id` (nullable)
  - `payload_json` (JSON)
  - `occurred_at`

3. `chat_logs`
  - `id` (PK)
  - `session_id` (FK -> `game_sessions.id`)
  - `user_message`
  - `ai_response`
  - `scene_id` (nullable)
  - `topic_id` (nullable)
  - `help_policy`
  - `guardrail_mode`
  - `citations` (JSONB)
  - `model_id` (e.g., `anthropic.claude-3-haiku-20240307-v1:0`)
  - `latency_ms`
  - `created_at`

### Research Query Examples

1. Hint effectiveness by topic:
  - Join `chat_logs` + subsequent `event_logs` (`quiz_result`) by `session_id` and time.

2. Spoiler policy audit:
  - Filter `chat_logs` where `guardrail_mode = 'spoiler'` and review `citations`.

3. Retrieval quality tracking:
  - Track `chat_logs.citations` (JSONB) against user follow-up success metrics.

## Bedrock RAG Corpus

The local corpus in `frontend/lib/bedrock.ts` contains 7 grounded lesson snippets.
Future semantic search: store embeddings in `content_corpus` (pgvector `vector(1536)` column).

Chunk metadata should include:
- `scene_id`
- `topic`
- `source_type`
- `source_id`

## Prompting and Guardrails

System rules:
1. Answer only using retrieved game knowledge.
2. If retrieval is insufficient, respond: "I don't have enough information from this lesson yet."
3. Keep tone aligned to game and student-friendly.
4. Enforce spoiler guard by scene progression.
5. Prefer hints over full solutions unless help level allows full explanation.

## Theme Sync Requirements

Share UI tokens in a config such as `chat_theme.json`:
- primary/background/text colors,
- border radius and border style,
- font family and sizes,
- spacing scale,
- animation speed/easing.

## Testing Checklist

1. Start backend and frontend.
2. Generate and use a student code on `/code-entry`.
3. Verify no mid-game code prompt appears.
4. Trigger scene/dialogue/choice/quiz events.
5. Confirm `/api/game/event` records all gameplay events.
6. Trigger `learning_context_update`, `player_state_update`, `help_policy_update`.
7. Ask chatbot questions and verify grounded answers + citations.
8. Finish game and confirm session completion.

## MVP Checklist

1. Emit three context events from Ren'Py (`learning_context_update`, `player_state_update`, `help_policy_update`).
2. Enable Vertex retrieval using game-only corpus.
3. Enforce no-hallucination fallback.
4. Enforce spoiler guard by progression metadata.
5. Store chat citation logs for audit.

## Success Criteria

- Bot feels native in game UI.
- Answers stay accurate and in-scope.
- No mid-game code verification prompts.
- Students receive context-aware, spoiler-safe help.
- Admin/research can audit quality using event and citation logs.
