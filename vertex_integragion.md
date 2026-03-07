# Vertex AI Integration Plan

This document defines how to integrate a small RAG-based helper chatbot (overlay UI) with the Ren'Py game iframe.

## Goal

Build a helper agent that:
- appears as part of the game UI (not a separate app),
- answers only from game-grounded knowledge,
- matches the game's tone/persona,
- helps students when they are confused,
- avoids spoilers and out-of-scope answers.

## Current Game Flow Alignment

The chatbot must follow the implemented game flow:
1. Student enters access code once at `/code-entry`.
2. No additional code prompts during gameplay.
3. Gameplay events are tracked (scene, dialogue, choices, quiz, game end).
4. Session ends at game completion.

## Chat Overlay UX Requirements

- Render chatbot as an overlay panel above the game iframe.
- Use the same visual tokens as the game UI (font, colors, border style, spacing).
- Keep panel collapsible/minimizable so it does not block gameplay.
- Pause or dim game when expanded (policy decision).
- Center the bot chat box with the game theme background.
-Hide chat bot option when question is asking or choice to made. 

## What Extra Data We Need from Ren'Py

These events/fields improve retrieval quality and grounding.

### 1) Stable IDs (Required)

Ren'Py should send IDs, not only display text:
- `scene_id`
- `dialogue_id`
- `choice_id`
- `quiz_id`
- `question_id`

Why: IDs let backend map user context to exact game chunks.

### 2) Learning Context (Required)

Send context updates whenever topic changes:
- `topic_id` (example: `functions.parameters`)
- `learning_objective`
- `difficulty_level`
- `concept_tags` (array)

### 3) Player State (Required)

Send progression signals for personalization:
- `current_scene_id`
- `choices_made` (IDs)
- `wrong_attempt_count`
- `hints_used`
- `time_in_scene_seconds`

### 4) Help Policy / Spoiler Guard (Required)

Send allowed help boundaries by scene:
- `allowed_help_level`: `nudge | hint | explain | full`
- `spoiler_guard`: `strict | medium | off`

### 5) Optional Analytics Markers

- `checkpoint_reached` can remain as analytics only.
- Do not use `request_checkpoint_code` for gameplay gating.

## Recommended Ren'Py -> Frontend Events

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

## RAG Corpus Preparation (Game-Grounded Data)

Prepare and index these sources for Vertex AI:
- scene teaching content,
- glossary and definitions,
- quiz questions and rationales,
- examples/code explanations shown in game,
- persona/tone guidelines for the helper character.

Each chunk should include metadata:
- `scene_id`, `topic_id`, `difficulty_level`, `source_type`, `canonical_term_ids`.

## Prompting / Guardrails

System rules for chatbot:
1. Answer only from retrieved game knowledge.
2. If retrieval is insufficient, say "I don't have enough information from this lesson yet."
3. Match game tone and keep explanations student-friendly.
4. Respect `spoiler_guard` and do not reveal future-scene content.
5. Prefer hints before full solutions unless `allowed_help_level` allows full explanation.

## Backend Contract Suggestions

Add a chat endpoint that receives:
- `session_token`
- user message
- latest game context (`scene_id`, `topic_id`, `help_policy`, `player_state`)

Return:
- assistant response
- citation sources (chunk IDs / titles)
- applied guardrail mode (`strict/medium/off`)

## Theme Sync Requirements

Extract and share game UI tokens for chat overlay:
- primary/background/text colors
- border radius and border style
- font family and sizes
- spacing scale
- animation speed/easing

Store in shared config (example: `chat_theme.json`) so game and bot stay visually consistent.

## MVP Checklist

1. Add `learning_context_update`, `player_state_update`, `help_policy_update` from Ren'Py.
2. Build minimal Vertex AI retrieval with game-only corpus.
3. Enforce no-hallucination fallback response.
4. Add spoiler guard using scene progression metadata.
5. Add citation logging for evaluation.

## Success Criteria

- Bot feels native to game UI.
- Answers stay in-game and accurate.
- No mid-game access/checkpoint code prompts are introduced.
- Students get context-aware help without spoilers.
- Admin/researcher can audit chat quality with source citations.
