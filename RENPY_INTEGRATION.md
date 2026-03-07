# Ren'Py Web Integration Guide

This guide explains the current integration used by this project.

## Final Flow (Implemented)

1. Admin generates many unique access codes (for example, 30 codes).
2. Professor gives one code to each student.
3. Student enters the code once at the beginning on `/code-entry`.
4. Game starts and runs without any additional code prompts.
5. During gameplay, events are logged (scene changes, dialogue, choices, quiz activity, game end).
6. At the end, the session is marked completed.

Important:
- No checkpoint code entry is required in the middle of the game.
- Do not build story flow around `request_checkpoint_code`.

## Architecture

- Ren'Py web build runs in an iframe: `/game/index.html`.
- Communication uses `window.postMessage()`.
- Frontend listens for Ren'Py events and sends them to backend `/api/game/event`.

## Message Contract

### Ren'Py -> Frontend

All messages must follow:

```json
{
  "type": "event_name",
  "payload": {}
}
```

Recommended events:

1. `scene_start`
2. `dialogue`
3. `choice_made`
4. `quiz_started`
5. `quiz_submitted`
6. `checkpoint_reached` (optional analytics only)
7. `game_ended`
8. `error` (optional)

### Frontend -> Ren'Py

Used messages:

1. `continue` (rare; can be used if you add explicit flow controls)
2. `checkpoint_verified` may be sent only as compatibility response if Ren'Py still emits old checkpoint requests

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

## Required Bridge in Ren'Py `index.html`

Add this script to the exported web `index.html` (or equivalent host page):

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

## Ren'Py Usage Pattern

Use one helper and send events at key points:

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

Gameplay example:

```python
label teaching1:
    python:
        send_to_frontend("scene_start", {
            "scene_name": "teaching1",
            "current_scene": "teaching1"
        })

    ale "Good morning! Let's learn about function parameters."

    python:
        send_to_frontend("dialogue", {
            "character_name": "ale",
            "dialogue_text": "Good morning! Let's learn about function parameters."
        })

    menu:
        "Choose your answer:"
        "Option A":
            python:
                send_to_frontend("choice_made", {
                    "choice_index": 0,
                    "choice_text": "Option A",
                    "scene_name": "teaching1"
                })
        "Option B":
            python:
                send_to_frontend("choice_made", {
                    "choice_index": 1,
                    "choice_text": "Option B",
                    "scene_name": "teaching1"
                })

    jump teaching2
```

At ending:

```python
label ending:
    python:
        send_to_frontend("game_ended", {
            "final_scene": "ending"
        })
    return
```

## Compatibility Note About Old Checkpoint Events

If old scripts still send `request_checkpoint_code`, frontend now treats it as legacy and auto-bypasses it. This keeps the game moving without asking players for extra codes.

Recommended cleanup:
- Remove `request_checkpoint_code` from Ren'Py scripts.
- Keep `checkpoint_reached` only if you want analytics markers.

## Testing Checklist

1. Start backend and frontend.
2. Login as admin and generate test codes.
3. Start game with a student code on `/code-entry`.
4. Confirm no code prompt appears during gameplay.
5. Make choices and submit quiz answers.
6. Verify events are logged in backend via `/api/game/event`.
7. Finish game and verify session ends successfully.

## Troubleshooting

### Messages not received

- Verify iframe loads the correct `index.html`.
- Check browser console for `postMessage` errors.
- Confirm bridge script exists in Ren'Py web `index.html`.

### Game asks for checkpoint code anyway

- Search Ren'Py scripts for `request_checkpoint_code` and remove those calls.
- Ensure latest frontend build is running.

### Events missing in backend

- Check session token exists before gameplay.
- Check backend API URL is correct (`NEXT_PUBLIC_API_BASE_URL`).
- Inspect network tab for `/api/game/event` requests.

## Summary

1. One student code is used only at game start.
2. No mid-game code verification is part of the flow.
3. Gameplay analytics come from event logging (`scene`, `dialogue`, `choice`, `quiz`, `game_ended`).
4. The iframe postMessage bridge is the core integration point.
