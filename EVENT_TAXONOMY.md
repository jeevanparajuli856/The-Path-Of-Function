# Event Taxonomy & Stable Identifiers
## The Path of Function - Research Data Contract

**Version:** 1.0  
**Last Updated:** March 6, 2026  
**Purpose:** Canonical reference for all event types, scene IDs, and data structures used in analytics

---

## 📋 Event Type Taxonomy

### Session Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `session_start` | Student begins game | `session_token`, `game_version` | `user_agent`, `browser_fingerprint` |
| `session_resume` | Student resumes paused session | `session_token`, `last_scene` | `pause_duration_seconds` |
| `session_pause` | Game paused/closed mid-session | `session_token`, `current_scene` | `completion_percentage` |
| `session_end` | Game completed or abandoned | `session_token`, `completion_type` | `total_duration_seconds` |

**Completion Types:** `full` (reached end), `partial` (stopped mid-game), `timeout` (expired)

---

### Scene Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `scene_enter` | Player enters new scene | `scene_id`, `chapter_id` | `previous_scene` |
| `scene_exit` | Player leaves scene | `scene_id`, `time_in_scene_seconds` | `next_scene` |

---

### Choice Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `choice_presented` | Menu/choice shown to player | `choice_id`, `options_list` | `context` |
| `choice_selected` | Player selects option | `choice_id`, `selected_option`, `option_text` | `time_to_decide_seconds` |

---

### Quiz Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `quiz_attempt` | Player starts quiz question | `quiz_id`, `question_text`, `attempt_number` | `max_attempts` |
| `quiz_result` | Quiz answered (correct/incorrect) | `quiz_id`, `is_correct`, `student_answer`, `attempts_used` | `correct_answer`, `time_to_answer_seconds` |

---

### Assessment Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `assessment_start` | Player begins major assessment | `assessment_id`, `assessment_type` | `instructions_shown` |
| `assessment_submit` | Player submits assessment | `assessment_id`, `answer_data` | `time_spent_seconds` |
| `assessment_result` | Assessment graded | `assessment_id`, `is_correct`, `score` | `feedback_shown` |

---

### Checkpoint Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `checkpoint_prompt` | Code re-entry prompt shown | `checkpoint_number` | `current_scene` |
| `checkpoint_pass` | Code verified successfully | `checkpoint_number`, `entered_code` | `verification_time_seconds` |
| `checkpoint_fail` | Code verification failed | `checkpoint_number`, `entered_code`, `attempt_number` | `error_message` |

---

### Error Events
| Event Type | Description | Required Fields | Optional Fields |
|------------|-------------|-----------------|-----------------|
| `error_occurred` | Unexpected error in game | `error_type`, `error_message` | `stack_trace`, `scene_id` |

---

## 🎬 Scene & Chapter IDs

### Chapter 1: Introduction & Basics
| Scene ID | Label Name | Description | Approx Duration |
|----------|------------|-------------|-----------------|
| `scene_intro_dream` | `inbed` | Kevin's nightmare about failing | 2 min |
| `scene_classroom_start` | `inbed` (second half) | Morning class, teacher intro | 2 min |
| `scene_hallway_meet` | `hallway` | Kevin meets Emma | 2 min |
| `scene_hallway_after` | `hallwayafter` | Transition to study session | 1 min |

### Chapter 2: Teaching Functions
| Scene ID | Label Name | Description | Approx Duration |
|----------|------------|-------------|-----------------|
| `scene_teaching1_start` | `teachingfirst` | Built-in functions lesson | 10 min |
| `scene_teaching1_userdef` | `teachingfirst` (second half) | User-defined functions | 8 min |
| `scene_teaching2_main` | `teachingSecond` | main() function concept | 8 min |

### Chapter 3: Assessment
| Scene ID | Label Name | Description | Approx Duration |
|----------|------------|-------------|-----------------|
| `scene_dragdrop_challenge` | `dragqns` | Drag-and-drop coding puzzle | 5-10 min |
| `scene_assessment_result` | `qnsSolved` or `qnsUnsolve` | Feedback on assessment | 2 min |

### Chapter 4: Advanced Concepts
| Scene ID | Label Name | Description | Approx Duration |
|----------|------------|-------------|-----------------|
| `scene_callstack_intro` | `afterDragNDrop` | Call stack visualization | 5 min |
| `scene_final_quiz` | `afterDragNDrop` (end) | Final concept check | 2 min |
| `scene_ending` | `ending` | Game conclusion | 2 min |

---

## 🎯 Quiz & Assessment IDs

### Quizzes (Text Input)
| Quiz ID | Label | Question | Correct Answer(s) | Max Attempts |
|---------|-------|----------|-------------------|--------------|
| `quiz_int_output` | `inputCheck` | "What will be the output?" (int(2.6)) | `"2"` | 3 |
| `quiz_fahrenheit_value` | `valcheck` | "What value will celsius hold?" (98°F) | `"36.67"`, `"36.7"`, `"36.66"`, `"37"` | 3 |
| `quiz_callstack_last` | `afterDragNDrop` (end) | "Which function was last removed?" | `"main()"` | 1 |

### Multiple Choice Quizzes
| Quiz ID | Label | Question | Options | Correct Option |
|---------|-------|----------|---------|----------------|
| `choice_builtin_remember` | `teachingfirst` | "Remember built-in functions?" | Yes, No | (both valid) |
| `choice_function_name` | `teachingfirst` | "What is the function name?" | fahrenheit, fahrenheitToCelsius | `fahrenheitToCelsius` |
| `choice_program_execute` | `teachingSecond` | "Will this program execute?" | Yes, Confused | `Yes` |
| `choice_ready_challenge` | `teachingSecond` | "Are you ready?" | Yes, No | (both valid) |
| `choice_want_explanation` | `qnsSolved` | "Want explanation?" | Yes, No | (both valid) |
| `choice_callstack_answer` | `afterDragNDrop` | "Last function removed?" | calculate_area(), main() | `main()` |

### Major Assessment
| Assessment ID | Type | Description | Components | Time Limit |
|---------------|------|-------------|------------|------------|
| `assessment_dragdrop_main` | Drag-and-Drop | Assemble Python program | 5 code blocks, 5 drop zones | None |

**Correct Solution:**
```
Box 1: def calculate_area(length, width)
Box 2: area = length * width
Box 3: length = 10
Box 4: area = calculate_area(length, width)
Box 5: main()
```

**Wrong Options:**
- `def calculate_area(width)` - Missing parameter
- `area = width * 2` - Wrong formula
- `len = 10` - Wrong variable name
- `area = calculate_area(width)` - Missing argument

---

## 🔢 Checkpoint Definitions

### Checkpoint 0: Game Start
- **Location:** Before `label start` execution
- **Purpose:** Initial code validation
- **Validation:** Code must be valid, unused or resumable
- **Failure Action:** Redirect to code entry page

### Checkpoint 1: Mid-Game (30-40% progress)
- **Location:** After `teachingfirst`, before `teachingSecond`
- **Purpose:** Verify continuing student identity
- **Validation:** Entered code must match session's original code
- **Failure Action:** Allow 3 retry attempts, then block progress
- **Approximate Time:** 15-20 minutes into gameplay

### Checkpoint 2: Late-Game (70-80% progress)
- **Location:** After `teachingSecond`, before `dragqns`
- **Purpose:** Final identity verification before assessment
- **Validation:** Entered code must match session's original code
- **Failure Action:** Allow 3 retry attempts, then block progress
- **Approximate Time:** 30-35 minutes into gameplay

---

## 📦 Event Data Schemas

### Example: `session_start` Event
```json
{
  "session_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "event_type": "session_start",
  "event_name": "game_launch",
  "event_data": {
    "game_version": "1.0",
    "timestamp_local": "2026-03-06T14:30:00Z",
    "user_agent": "Mozilla/5.0...",
    "browser_fingerprint": "hash123abc",
    "referrer": "https://yoursite.com/enter-code"
  }
}
```

### Example: `scene_enter` Event
```json
{
  "session_token": "...",
  "event_type": "scene_enter",
  "event_name": "scene_teaching1_start",
  "scene_id": "scene_teaching1_start",
  "chapter_id": "chapter_2",
  "event_data": {
    "previous_scene": "scene_hallway_after",
    "timestamp_local": "2026-03-06T14:35:22Z"
  }
}
```

### Example: `choice_selected` Event
```json
{
  "session_token": "...",
  "event_type": "choice_selected",
  "event_name": "choice_builtin_remember",
  "scene_id": "scene_teaching1_start",
  "event_data": {
    "choice_id": "choice_builtin_remember",
    "question": "Do you remember anything about Python's built-in functions?",
    "selected_option": "Yes",
    "options_presented": ["Yes", "No"],
    "time_to_decide_seconds": 3,
    "timestamp_local": "2026-03-06T14:36:45Z"
  }
}
```

### Example: `quiz_result` Event
```json
{
  "session_token": "...",
  "event_type": "quiz_result",
  "event_name": "quiz_int_output",
  "scene_id": "scene_teaching1_start",
  "event_data": {
    "quiz_id": "quiz_int_output",
    "question_text": "What will be the output?",
    "student_answer": "2",
    "correct_answer": "2",
    "is_correct": true,
    "attempts_used": 1,
    "max_attempts": 3,
    "time_to_answer_seconds": 12,
    "timestamp_local": "2026-03-06T14:38:10Z"
  }
}
```

### Example: `assessment_result` Event
```json
{
  "session_token": "...",
  "event_type": "assessment_result",
  "event_name": "assessment_dragdrop_main",
  "scene_id": "scene_dragdrop_challenge",
  "event_data": {
    "assessment_id": "assessment_dragdrop_main",
    "assessment_type": "drag_and_drop",
    "is_correct": true,
    "score": 1.0,
    "answer_map": {
      "box1": "optC1",
      "box2": "optC2",
      "box3": "optC3",
      "box4": "optC4",
      "box5": "optC5"
    },
    "time_spent_seconds": 342,
    "retry_count": 0,
    "timestamp_local": "2026-03-06T14:52:30Z"
  }
}
```

### Example: `checkpoint_pass` Event
```json
{
  "session_token": "...",
  "event_type": "checkpoint_pass",
  "event_name": "checkpoint_1_verified",
  "event_data": {
    "checkpoint_number": 1,
    "entered_code": "A7Q2M5",
    "verification_time_seconds": 8,
    "current_scene": "scene_teaching2_main",
    "timestamp_local": "2026-03-06T14:45:18Z"
  }
}
```

---

## 🗂️ Complete Scene-to-Label Mapping

| Scene ID | Ren'Py Label | File | Hook Location |
|----------|--------------|------|---------------|
| `scene_intro_dream` | `inbed` (start) | [BeforeWakeup.rpy](game/SceneScript/BeforeWakeup.rpy) | After `label inbed:` |
| `scene_classroom_start` | `inbed` (middle) | [BeforeWakeup.rpy](game/SceneScript/BeforeWakeup.rpy) | After classroom entry |
| `scene_hallway_meet` | `hallway` | [hallwayscene.rpy](game/SceneScript/hallwayscene.rpy) | After `label hallway:` |
| `scene_hallway_after` | `hallwayafter` | [hallwayafter.rpy](game/SceneScript/hallwayafter.rpy) | After `label hallwayafter:` |
| `scene_teaching1_start` | `teachingfirst` | [teaching1.rpy](game/SceneScript/teaching1.rpy) | After `label teachingfirst:` |
| `scene_teaching2_main` | `teachingSecond` | [teaching2.rpy](game/SceneScript/teaching2.rpy) | After `label teachingSecond:` |
| `scene_dragdrop_challenge` | `dragqns` | [dragNDropFirst.rpy](game/FrameNFunction/dragNDropFirst.rpy) | After `screen drag_drop:` shown |
| `scene_assessment_solved` | `qnsSolved` | [afterSubmission.rpy](game/SceneScript/afterSubmission.rpy) | After `label qnsSolved:` |
| `scene_assessment_failed` | `qnsUnsolve` | [afterSubmission.rpy](game/SceneScript/afterSubmission.rpy) | After `label qnsUnsolve:` |
| `scene_callstack_lesson` | `afterDragNDrop` | [afterSubmission.rpy](game/SceneScript/afterSubmission.rpy) | After `label afterDragNDrop:` |
| `scene_ending` | `ending` | [afterSubmission.rpy](game/SceneScript/afterSubmission.rpy) | After `label ending:` |

---

## 🎨 Event Naming Conventions

### Format
`{event_type}_{descriptor}`

### Examples
- `scene_enter` → Actual event name: `scene_teaching1_start`
- `choice_selected` → Actual event name: `choice_builtin_remember`
- `quiz_result` → Actual event name: `quiz_int_output`
- `assessment_result` → Actual event name: `assessment_dragdrop_main`

### Rules
1. Use snake_case for all identifiers
2. Be descriptive but concise
3. Include context in event_data, not event_name
4. Scene IDs must start with `scene_`
5. Quiz IDs must start with `quiz_`
6. Assessment IDs must start with `assessment_`
7. Choice IDs must start with `choice_`

---

## 📊 Analytics Query Reference

### Common Queries

**Session completion rate:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as completion_rate
FROM game_sessions;
```

**Average quiz accuracy:**
```sql
SELECT 
  quiz_id,
  COUNT(*) FILTER (WHERE is_correct = TRUE) * 100.0 / COUNT(*) as accuracy_pct
FROM quiz_attempts
GROUP BY quiz_id;
```

**Checkpoint passage rates:**
```sql
SELECT 
  checkpoint_number,
  COUNT(*) FILTER (WHERE is_valid = TRUE) * 100.0 / COUNT(*) as pass_rate
FROM checkpoint_verifications
GROUP BY checkpoint_number;
```

**Average time per scene:**
```sql
WITH scene_times AS (
  SELECT 
    scene_id,
    session_id,
    MAX(created_at) - MIN(created_at) as time_in_scene
  FROM event_logs
  WHERE event_type IN ('scene_enter', 'scene_exit')
  GROUP BY scene_id, session_id
)
SELECT 
  scene_id,
  AVG(EXTRACT(EPOCH FROM time_in_scene)) as avg_seconds
FROM scene_times
GROUP BY scene_id;
```

---

## ✅ Validation Rules

### Event Sequence Validation

**Valid sequences:**
1. `session_start` → `scene_enter` → ... → `session_end`
2. `scene_enter` → `scene_exit` (must exit before entering new scene)
3. `quiz_attempt` → `quiz_result` (must complete quiz)
4. `assessment_start` → `assessment_submit` → `assessment_result`
5. `checkpoint_prompt` → `checkpoint_pass` OR `checkpoint_fail`

**Invalid sequences (rejected by backend):**
- `checkpoint_2_pass` before `checkpoint_1_pass`
- `session_end` before `session_start`
- Duplicate `session_start` with same token
- Scene IDs not in predefined list

---

## 🔄 Event Replay & Debugging

### Test Event Payloads

Use these for integration testing:

**Test Session Start:**
```bash
curl -X POST https://api.yourdomain.com/api/game/event \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "test_token_123",
    "event_type": "session_start",
    "event_data": {"game_version": "1.0"}
  }'
```

**Test Quiz Result:**
```bash
curl -X POST https://api.yourdomain.com/api/game/event \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "test_token_123",
    "event_type": "quiz_result",
    "event_name": "quiz_int_output",
    "scene_id": "scene_teaching1_start",
    "event_data": {
      "quiz_id": "quiz_int_output",
      "is_correct": true,
      "student_answer": "2",
      "attempts_used": 1
    }
  }'
```

---

## 📝 Change Log

### Version 1.0 (March 6, 2026)
- Initial taxonomy definition
- All scene IDs, quiz IDs, and assessment IDs defined
- Event schemas documented
- Checkpoint locations specified

### Future Versions
- v1.1: Add events for AI interactions (Phase 2)
- v1.2: Add events for adaptive difficulty (Phase 3)
- v1.3: Add events for collaborative features (Phase 4)

---

**This document is the authoritative reference for all analytics implementation. Any changes must be versioned and communicated to all team members.**

**Next Step:** Use these IDs when implementing backend validation and Ren'Py hooks.
