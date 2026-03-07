# Event Taxonomy & Stable Identifiers
## The Path of Function - Canonical Telemetry Contract

**Version:** 2.0  
**Last Updated:** March 7, 2026  
**Purpose:** Canonical event contract for Ren'Py telemetry, logging, and chatbot context

---

## Canonical Event Types

### Session
- `session_start`
- `session_resume`
- `session_pause`
- `session_end`

### Core gameplay
- `scene_start`
- `dialogue`
- `choice_made`
- `quiz_started`
- `quiz_submitted`
- `game_ended`

### Context-for-chat (required for grounded support)
- `learning_context_update`
- `player_state_update`
- `help_policy_update`

### Checkpoint analytics
- `checkpoint_reached`
- `request_checkpoint_code`

Checkpoint events are analytics-only. Gameplay is not blocked by checkpoint re-entry.

### Error
- `error`

---

## Required Payload IDs

Use stable IDs in payloads for analytics and retrieval:
- `scene_id`
- `dialogue_id`
- `choice_id`
- `quiz_id`
- `question_id`
- `topic_id`

---

## Context Payload Shapes

### `learning_context_update`
```json
{
  "scene_id": "teaching1",
  "topic_id": "functions.parameters",
  "learning_objective": "Understand function parameters",
  "difficulty_level": "beginner",
  "concept_tags": ["function", "parameter", "argument"]
}
```

### `player_state_update`
```json
{
  "current_scene_id": "teaching1",
  "choices_made": ["choice_a", "choice_b"],
  "quiz_id": "q1_dragdrop_main",
  "question_id": "dragdrop_main_1",
  "wrong_attempt_count": 2,
  "hints_used": 1,
  "time_in_scene_seconds": 84
}
```

### `help_policy_update`
```json
{
  "allowed_help_level": "hint",
  "spoiler_guard": "strict"
}
```

---

## Legacy Compatibility

Legacy types such as `scene_enter`, `choice_selected`, `quiz_result`, and `checkpoint_pass` may appear in old datasets and are still accepted by DB constraints.

For all new implementation, emit canonical event types listed above.

---

## Validation Rules

1. `session_start` must happen before gameplay events.
2. `scene_start` should update current scene context.
3. `quiz_started` should precede `quiz_submitted` for the same question.
4. `game_ended` should be the terminal gameplay event for completed sessions.

---

## Practical Test Payload

```json
{
  "session_token": "stu_abc123",
  "event_type": "learning_context_update",
  "event_data": {
    "scene_id": "teaching1",
    "topic_id": "functions.parameters",
    "learning_objective": "Understand function parameters",
    "difficulty_level": "beginner",
    "concept_tags": ["function", "parameter", "argument"]
  }
}
```
