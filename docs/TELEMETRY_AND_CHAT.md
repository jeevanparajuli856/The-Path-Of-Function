# Telemetry and Chat Contract

## Ren'Py -> Frontend Bridge
Message shape:

```json
{ "type": "event_name", "payload": {} }
```

Bridge function expected in Ren'Py web `index.html`:

```js
window.sendToFrontend(type, payload)
```

## Canonical Event Types
- `scene_start`
- `dialogue`
- `choice_made`
- `learning_context_update`
- `help_policy_update`
- `player_state_update`
- `quiz_started`
- `quiz_submitted`
- `player_prompt_started`
- `player_prompt_resolved`
- `checkpoint_reached`
- `request_checkpoint_code`
- `game_ended`
- `error`

## Chat Guardrails (Current)
- Chat is available from hallway onward.
- During active quiz/prompt, Emma gives hints only.
- No exact final answer/choice/output for active assessment steps.
- Non-lesson questions are answered in a welcoming tone with soft lesson anchoring.

## API Endpoints Used
- `POST /api/game/event`
- `POST /api/chat/ask`
- `POST /api/game/final-verify`
- `POST /api/game/session-end`

## Data Notes
- `event_logs` keyed by `session_id`
- chat logs persist user message, assistant response, context, guardrail mode
- telemetry context is merged server-side for chat grounding
