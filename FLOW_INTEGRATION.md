# Complete Flow: Code Entry → Game → Checkpoint Verification

## Overview

This document maps the complete user journey from code entry through checkpoint verification, showing how each component communicates.

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Journey Map                             │
└─────────────────────────────────────────────────────────────────┘

1. LANDING PAGE (/)
   ├─ User sees "The Path of Function" title
   └─ User clicks "Enter Game"
       ↓
2. CODE ENTRY PAGE (/code-entry)
   ├─ User enters access code
   ├─ Frontend validates code via: POST /student/validate-code
   ├─ If valid and can_start=true → proceed
   ├─ If valid and can_resume=true → resume previous session
   └─ Frontend calls: POST /student/start-session OR resume-session
       ├─ Backend creates GameSession in database
       ├─ Returns session_token
       └─ Frontend stores session in Zustand
           ↓
3. GAME PAGE (/game)
   ├─ Frontend shows header with treatment group
   ├─ Frontend loads Ren'Py game in iframe
   └─ Game initializes
       ├─ Ren'Py sends: scene_start
       └─ Frontend logs: POST /game/event (scene_enter)
           ↓
4. GAMEPLAY
   ├─ Player controls Ren'Py character
   ├─ Ren'Py sends events:
   │  ├─ scene_start (new location)
   │  ├─ dialogue (character speaking)
   │  ├─ choice_made (player selection)
   │  └─ quiz_submitted (quiz answer)
   ├─ Frontend receives via postMessage()
   └─ Frontend logs via: POST /game/event
       ↓
5. CHECKPOINT REACHED
   ├─ Ren'Py sends: checkpoint_reached
   ├─ Ren'Py displays code on screen (e.g., "FUNC123")
   ├─ Ren'Py sends: request_checkpoint_code
   └─ Frontend shows modal with input field
       ├─ Player enters code
       ├─ Frontend calls: POST /game/checkpoint
       │  ├─ Backend verifies code matches checkpoint number
       │  ├─ Returns: {verified: true/false, attempts_remaining}
       │  └─ Frontend displays result
       ├─ If correct:
       │  ├─ Frontend sends: checkpoint_verified {verified: true}
       │  └─ Ren'Py continues to next scene
       └─ If incorrect:
           ├─ Frontend sends: checkpoint_verified {verified: false}
           └─ Ren'Py shows retry prompt
               ↓
6. GAME COMPLETION
   ├─ Ren'Py sends: game_ended
   ├─ Frontend calls: POST /game/end-session
   ├─ Backend records completion
   └─ Frontend redirects to home page
```

## API Calls Flow

### Code Validation & Session Start

```
User Input: code = "ABCD12"
       ↓
Frontend: POST /student/validate-code
  Body: {code: "ABCD12"}
  ↓
Backend checks:
  - Is code valid? (exists in access_codes table)
  - Is code active? (is_active = true)
  - Has code expired? (expires_at > now())
  - Is code already used? (used_at is null)
  - If using existing code: can resume? (within 7 days)
  ↓
Response: ValidateCodeResponse
  {
    valid: true,
    can_start: true,
    can_resume: false,
    message: "Code is valid and ready to use"
  }
  ↓
User clicks: "Enter Game"
       ↓
Frontend: POST /student/start-session
  Body: {code: "ABCD12"}
  ↓
Backend:
  - Verifies code again
  - Marks code as used_at = now()
  - Creates GameSession record
  - Generates session_token
  ↓
Response: StartSessionResponse
  {
    session_id: "uuid-here",
    session_token: "token-here",
    treatment_group: "control",
    game_url: "/game/index.html",
    expires_in: 604800  // 7 days in seconds
  }
  ↓
Frontend stores in Zustand:
  {
    session_id: "uuid-here",
    session_token: "token-here",
    started_at: Date.now(),
    expires_at: Date.now() + expires_in*1000
  }
  ↓
Redirect to /game
```

### Event Logging

```
Ren'Py: sends("scene_start", {scene_name: "hallway"})
  ↓
Frontend: receives via postMessage()
  ↓
Frontend: POST /game/event
  Body: {
    session_token: "token-here",
    event_type: "scene_enter",
    event_data: {scene_name: "hallway"}
  }
  ↓
Backend:
  - Finds GameSession by session_token
  - Creates EventLog record
  - Updates current_scene in GameSession
  ↓
Database:
  event_logs table:
    id (UUID)
    session_id (UUID FK)
    event_type: "scene_enter"
    event_data: {...}
    created_at: timestamp
```

### Checkpoint Verification

```
Ren'Py shows code on screen: "FUNC123"
  ↓
Ren'Py: sends("request_checkpoint_code", {
  checkpoint_number: 1,
  prompt_text: "Enter code from screen",
  max_attempts: 3,
  current_attempt: 1
})
  ↓
Frontend: shows modal with input field
  ↓
User enters: "FUNC123" (may be case-insensitive)
  ↓
Frontend: POST /game/checkpoint
  Body: {
    session_token: "token-here",
    checkpoint_number: 1,
    code_entered: "FUNC123"
  }
  ↓
Backend:
  - Verifies code matches checkpoint number
  - Hardcoded: checkpoint 1 → "FUNC123"
  - Hardcoded: checkpoint 2 → "FUNC456"
  - Increments attempt count
  - Creates CheckpointVerification record
  - Updates session's checkpoint_1_verified_at
  ↓
Response: CheckpointResponse
  {
    verified: true,
    attempts_used: 1,
    attempts_remaining: 2,
    message: "Checkpoint verified!"
  }
  ↓
Frontend: sends("checkpoint_verified", {
  checkpoint_number: 1,
  verified: true
})
  ↓
Ren'Py: receives message
  ↓
Ren'Py: continues to next scene
```

### Session End

```
Ren'Py completes or user clicks "End Session"
  ↓
Ren'Py: sends("game_ended", {
  time_elapsed: 45,
  checkpoints_passed: 2,
  quizzes_completed: 5,
  final_score: 85
})
  ↓
Frontend: POST /game/end-session
  Body: {
    session_token: "token-here",
    completion_status: "completed",
    final_score: 85
  }
  ↓
Backend:
  - Finds GameSession
  - Sets ended_at = now()
  - Calculates duration_minutes
  - Stores final_data JSON
  ↓
Database updated:
  game_sessions:
    ended_at: timestamp
    completion_status: "completed"
    duration_minutes: 45
    final_data: {score: 85, ...}
  ↓
Frontend: resets store
  ↓
Frontend: redirects to /
```

## Admin Dashboard Flow

```
Admin logs in at: /admin/login
  ├─ Enters email & password
  ├─ Frontend: POST /admin/login
  ├─ Backend verifies credentials
  ├─ Returns JWT access_token
  └─ Frontend stores in localStorage + Zustand
       ↓
Redirects to: /admin
       ├─ Fetches: GET /admin/batches
       │  └─ Returns list of code batches with stats
       ├─ Fetches: GET /admin/dashboard/summary
       │  └─ Returns aggregated stats
       └─ Displays dashboard with:
           ├─ Stats cards: total codes, active sessions, etc.
           ├─ Code batches table
           └─ "Generate New Batch" button
               ↓
Admin clicks: "Generate New Batch"
       ├─ Shows modal with:
       │  ├─ Batch name input
       │  ├─ Number of codes input
       │  └─ Treatment group dropdown
       ├─ Frontend: POST /admin/generate-codes
       │  Body: {
       │    batch_name: "Spring 2024",
       │    num_codes: 30,
       │    treatment_group: "control"
       │  }
       ├─ Backend:
       │  ├─ Creates CodeBatch record
       │  ├─ Generates 30 unique codes
       │  └─ Creates AccessCode records
       ├─ Response: {batch_id, codes_generated, codes: [...]}
       └─ Frontend refreshes tables
```

## Database Schema (Simplified)

```
code_batches (PK: id UUID)
├─ batch_name
├─ created_by_admin_id (FK → admin_users)
├─ treatment_group
└─ created_at

access_codes (PK: id UUID)
├─ code (unique: "ABCD12")
├─ batch_id (FK → code_batches)
├─ treatment_group
├─ is_active
├─ used_at (NULL until used)
└─ expires_at

game_sessions (PK: id UUID)
├─ session_token (unique)
├─ code_id (FK → access_codes)
├─ treatment_group
├─ started_at
├─ ended_at (NULL if ongoing)
├─ current_scene
├─ checkpoint_1_verified_at
├─ checkpoint_2_verified_at
├─ completion_status
└─ duration_minutes

event_logs (PK: id UUID)
├─ session_id (FK → game_sessions)
├─ event_type ("scene_enter", "dialogue", etc.)
├─ event_data (JSON)
└─ created_at

checkpoint_verifications (PK: id UUID)
├─ session_id (FK → game_sessions)
├─ checkpoint_number (1 or 2)
├─ code_entered
├─ is_correct (True/False)
├─ attempt_number
└─ verified_at (NULL if not yet)
```

## Key Integration Points

### 1. Code Entry Validation
- **Where**: `/code-entry` page
- **API**: POST `/student/validate-code`
- **Purpose**: Check if code is valid and determine if user can start new game or resume old one

### 2. Session Creation
- **Where**: `/code-entry` page → `/game` page transition
- **API**: POST `/student/start-session` or `/student/resume-session`
- **Purpose**: Create database record and get session token for tracking

### 3. Event Logging
- **Where**: Game page receives postMessage from Ren'Py
- **API**: POST `/game/event` (single) or `/game/events/batch` (multiple)
- **Purpose**: Track all game actions for research analytics

### 4. Checkpoint Verification
- **Where**: Game page shows modal when Ren'Py requests code
- **API**: POST `/game/checkpoint`
- **Purpose**: Verify code matches checkpoint number, enforce attempts limit

### 5. Session End
- **Where**: Game page when game_ended event received
- **API**: POST `/game/end-session`
- **Purpose**: Mark game complete, calculate duration, archive data

### 6. Admin Analytics
- **Where**: `/admin` dashboard
- **APIs**: GET `/admin/batches`, `/admin/dashboard/summary`, POST `/admin/generate-codes`
- **Purpose**: Manage codes and monitor research metrics

## Session Lifecycle

```
START
  ↓
Code Entry Page
  ├─ Player enters code
  ├─ [VALIDATE] Check code exists and is available
  ├─ [START_SESSION] Create database record
  └─ Store session in Zustand (localStorage)
      ↓
Game Page
  ├─ Load Ren'Py in iframe
  ├─ [SESSION_VALID?] Check 7-day expiry
  ├─ [LOG_EVENTS] All Ren'Py events logged
  ├─ [VERIFY_CODES] When checkpoint reached
  └─ [TRACK_PROGRESS] Current scene, attempts, etc.
      ↓
Game Completion
  ├─ Ren'Py sends game_ended
  ├─ [END_SESSION] Mark completed in database
  ├─ [ARCHIVE_FINAL_DATA] Save scores, times, etc.
  └─ Clear Zustand, redirect to home
      ↓
END

Duration: Typically 30-90 minutes
Resume window: 7 days from start_at
```

## What's Implemented

✅ **Code Entry Flow**
- Code validation endpoint
- Session creation endpoint
- Session resume logic (7-day window)
- Frontend UI with real-time validation

✅ **Game Page**
- Ren'Py iframe container
- postMessage communication setup
- Event listener registration
- Checkpoint modal display

✅ **Checkpoint Verification**
- Hardcoded codes: FUNC123 (cp1), FUNC456 (cp2)
- Attempt tracking
- Database logging
- Message passing to Ren'Py

✅ **Event Logging**
- Event logging endpoint
- All event types supported
- Batch logging for offline

✅ **Admin Dashboard**
- Code batch generation
- Batch listing and stats
- Dashboard summary
- Authentication with JWT

## Next Steps

1. **Deploy Ren'Py Web Build**
   - Export your Ren'Py game as web build
   - Save to `/public/game/index.html`
   - Test loading in iframe

2. **Integrate Ren'Py Communication**
   - Add postMessage calls to your Ren'Py script
   - Use provided `RENPY_INTEGRATION.md` as guide
   - Test sending/receiving messages

3. **Test End-to-End Flow**
   - Enter code → see game
   - Trigger checkpoint → verify code
   - Complete game → see final stats

4. **Production Deployment**
   - Deploy backend to server
   - Deploy frontend to Vercel
   - Update API URL in environment variables
   - Test from production URLs

## Support Resources

- **Frontend Code**: `/frontend/app/game/page.tsx`, `/frontend/components/GameWindow.tsx`
- **Ren'Py Guide**: `RENPY_INTEGRATION.md`
- **Backend API**: `/backend/app/api/game.py`
- **Database**: Supabase dashboard
