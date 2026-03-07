# Research Data Collection System - Implementation Plan
## The Path of Function - Educational VN Research Integration

**Project:** Ren'Py Game + Research Data Pipeline  
**Version:** Phase 1 - Access Control + Data Collection  
**Last Updated:** March 6, 2026  
**Status:** Implementation Started

---

## 📋 Executive Summary

Build a production-safe research data collection system around the existing functional Ren'Py web game (deployed on itch.io). The system will:

- Generate and validate anonymous access codes for treatment groups
- Track detailed gameplay events (scenes, choices, quizzes, assessments)
- Implement start + 2 checkpoint code verification for research integrity
- Support resumable sessions (7-day window)
- Provide admin portal for code management and analytics
- Export anonymized data for statistical analysis
- **Future-proof for Phase 2/3:** Vertex AI + RAG integration without architecture rework

**Stack Decision:**
- **Vercel** → Frontend (student portal + admin dashboard)
- **Railway** → FastAPI backend (validation + event ingestion)
- **Supabase** → PostgreSQL database (research data store)
- **Ren'Py WebGL** → Existing game (minimal instrumentation added)

**Key Research Decisions:**
- ✅ Checkpoints: Start + 2 mid-game verifications
- ✅ Logging: Detailed events (scenes, choices, quizzes, timing)
- ✅ Survey linking: By access code only (anonymized)
- ✅ Session resume: Allowed within 7 days
- ✅ Future AI: Architecture placeholders only (no active endpoints)

---

## 🎯 Core Principles

### 1. **Anonymization First**
- System stores **only** access codes (e.g., `A7Q2M5`, `K3XP9T`)
- Professor maintains private mapping: `code → student name`
- No PII (names, emails, student IDs) in database
- Compliant with IRB/FERPA requirements

### 2. **Data Integrity**
- Server-side validation for all critical events
- Checkpoint sequence enforcement (cannot skip)
- One active session per code (configurable)
- Reject out-of-order events
- Idempotent writes for session start/end

### 3. **Separation of Concerns**
- **Ren'Py**: Story logic + user experience (unchanged)
- **JS Bridge**: Event capture + API communication
- **FastAPI**: Validation + business rules
- **Supabase**: Persistent storage + reporting

### 4. **Minimal VN Instrumentation**
- Add thin analytics layer at key hook points
- **Do not** rewrite narrative or quiz logic
- Keep game playable standalone (graceful degradation)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        STUDENT FLOW                          │
└─────────────────────────────────────────────────────────────┘

Student visits URL
    ↓
Vercel Frontend (Code Entry Page)
    ↓ POST /api/student/validate-code
FastAPI Backend (Railway)
    ↓ checks Supabase
access_codes table → valid?
    ↓ yes
Create/Resume game_sessions record
    ↓ return session_token
Launch Ren'Py WebGL with ?session_token=xxx
    ↓
Ren'Py fires events → JS Bridge → POST /api/game/event
    ↓
FastAPI validates + writes to event_logs table
    ↓
At checkpoints: Re-verify code → checkpoint_verifications table
    ↓
Session ends → session_end event → update game_sessions

┌─────────────────────────────────────────────────────────────┐
│                       ADMIN/PROFESSOR FLOW                   │
└─────────────────────────────────────────────────────────────┘

Admin logs in (Vercel Auth)
    ↓
Admin Dashboard (Vercel)
    ↓ POST /api/admin/generate-codes
FastAPI creates batch → access_codes table
    ↓ GET /api/admin/export-codes
Download CSV: Code, Name (blank)
    ↓
Professor distributes codes to students
    ↓ (Professor maintains private mapping)
    ↓
POST /api/admin/export-analytics
Download research dataset (anonymized)
    ↓
Merge with survey data offline using codes
```

---

## 📊 Database Schema (Supabase PostgreSQL)

### Core Tables

#### 1. `code_batches`
Grouping for generated code sets (e.g., "Spring 2026 CSCI 2000")

```sql
CREATE TABLE code_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name TEXT NOT NULL,
    treatment_group TEXT, -- e.g., "control", "intervention_A"
    course_name TEXT,
    generated_by UUID REFERENCES admin_users(id),
    num_codes INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);
```

#### 2. `access_codes`
Individual participant access codes

```sql
CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES code_batches(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL, -- 6-char: e.g., "A7Q2M5"
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    first_used_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_batch ON access_codes(batch_id);
```

#### 3. `game_sessions`
One record per student gameplay instance

```sql
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID REFERENCES access_codes(id),
    session_token TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- active, paused, completed, abandoned
    game_version TEXT DEFAULT '1.0',
    current_scene TEXT,
    current_checkpoint INTEGER DEFAULT 0, -- 0=start, 1=first, 2=second
    total_duration_seconds INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Checkpoint verification timestamps
    checkpoint_1_verified_at TIMESTAMPTZ,
    checkpoint_2_verified_at TIMESTAMPTZ,
    
    -- Session metadata
    user_agent TEXT,
    ip_address INET, -- optional, for fraud detection only
    browser_fingerprint TEXT,
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    CONSTRAINT valid_checkpoint CHECK (current_checkpoint >= 0 AND current_checkpoint <= 2)
);

CREATE INDEX idx_sessions_code ON game_sessions(code_id);
CREATE INDEX idx_sessions_token ON game_sessions(session_token);
CREATE INDEX idx_sessions_status ON game_sessions(status);
```

#### 4. `event_logs`
Detailed gameplay event stream

```sql
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- session_start, scene_enter, choice_selected, etc.
    event_name TEXT, -- specific identifier: "scene_teaching1", "quiz_int_output"
    scene_id TEXT,
    chapter_id TEXT,
    event_data JSONB, -- flexible payload for event-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'session_start', 'session_resume', 'session_pause', 'session_end',
        'scene_enter', 'scene_exit',
        'choice_presented', 'choice_selected',
        'quiz_attempt', 'quiz_result',
        'assessment_start', 'assessment_submit', 'assessment_result',
        'checkpoint_prompt', 'checkpoint_pass', 'checkpoint_fail',
        'error_occurred'
    ))
);

CREATE INDEX idx_events_session ON event_logs(session_id);
CREATE INDEX idx_events_type ON event_logs(event_type);
CREATE INDEX idx_events_created ON event_logs(created_at);
CREATE INDEX idx_events_data_gin ON event_logs USING GIN (event_data);
```

#### 5. `quiz_attempts`
Structured quiz performance data

```sql
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL, -- e.g., "quiz_int_output", "quiz_fahrenheit"
    question_text TEXT,
    attempt_number INTEGER DEFAULT 1,
    student_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN,
    time_to_answer_seconds INTEGER,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_session ON quiz_attempts(session_id);
CREATE INDEX idx_quiz_id ON quiz_attempts(quiz_id);
```

#### 6. `checkpoint_verifications`
Code re-entry verification log

```sql
CREATE TABLE checkpoint_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    checkpoint_number INTEGER NOT NULL, -- 0, 1, 2
    entered_code TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL,
    verification_attempt INTEGER DEFAULT 1,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_checkpoint_num CHECK (checkpoint_number >= 0 AND checkpoint_number <= 2)
);

CREATE INDEX idx_checkpoint_session ON checkpoint_verifications(session_id);
```

#### 7. `admin_users`
Research team authentication

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'researcher', -- admin, researcher, observer
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_email ON admin_users(email);
```

#### 8. `audit_logs`
Track admin actions for accountability

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL, -- generate_codes, disable_code, export_data
    target_type TEXT, -- code_batch, access_code, session
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Backend service role has full access
-- Restrict direct client access
-- (Policies configured in Supabase dashboard)
```

---

## 🔌 API Endpoints (FastAPI on Railway)

### Authentication
- `POST /api/admin/login` - Admin login (returns JWT)
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Get current admin profile

### Admin - Code Management
- `POST /api/admin/generate-codes` - Generate access code batch
  ```json
  {
    "batch_name": "Spring 2026 CSCI 2000",
    "treatment_group": "control",
    "num_codes": 30,
    "course_name": "Introduction to Programming"
  }
  ```
- `GET /api/admin/batches` - List all code batches
- `GET /api/admin/batches/{batch_id}/codes` - Get codes in batch
- `POST /api/admin/codes/{code_id}/disable` - Disable a code
- `POST /api/admin/codes/{code_id}/enable` - Re-enable a code

### Admin - Analytics & Export
- `GET /api/admin/analytics/summary` - High-level stats dashboard
  ```json
  {
    "total_codes_generated": 120,
    "codes_used": 87,
    "active_sessions": 3,
    "completed_sessions": 74,
    "avg_completion_time_minutes": 42,
    "quiz_avg_accuracy": 0.78
  }
  ```
- `GET /api/admin/analytics/by-group` - Compare treatment groups
- `POST /api/admin/export/codes` - Download CSV: `Code, Name`
- `POST /api/admin/export/analytics` - Download research dataset CSV

### Student - Access
- `POST /api/student/validate-code` - Check if code is valid
  ```json
  {
    "code": "A7Q2M5"
  }
  ```
  Response:
  ```json
  {
    "valid": true,
    "has_existing_session": false,
    "can_resume": false
  }
  ```
- `POST /api/student/start-session` - Create new session
  ```json
  {
    "code": "A7Q2M5",
    "user_agent": "...",
    "game_version": "1.0"
  }
  ```
  Response:
  ```json
  {
    "session_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "session_id": "uuid-here",
    "game_url": "https://yourgame.com/play?token=..."
  }
  ```
- `POST /api/student/resume-session` - Resume existing session (if < 7 days)

### Game - Event Ingestion
- `POST /api/game/event` - Log gameplay event
  ```json
  {
    "session_token": "...",
    "event_type": "scene_enter",
    "event_name": "scene_teaching1",
    "event_data": {
      "scene_id": "teaching1",
      "timestamp_local": "2026-03-06T14:30:00Z"
    }
  }
  ```
- `POST /api/game/checkpoint` - Verify code at checkpoint
  ```json
  {
    "session_token": "...",
    "checkpoint_number": 1,
    "entered_code": "A7Q2M5"
  }
  ```
  Response:
  ```json
  {
    "valid": true,
    "message": "Checkpoint verified! Continue playing."
  }
  ```
- `POST /api/game/session-end` - Mark session complete
- `POST /api/game/heartbeat` - Update last_active_at (for abandon detection)

---

## 🎮 Ren'Py Integration Strategy

### Minimal Instrumentation Approach

**Goal:** Add analytics without rewriting VN logic.

**Implementation:**

1. **Create `game/analytics.rpy`** (new file):
```renpy
init python:
    import json
    from datetime import datetime
    
    # Session management
    persistent.session_token = None
    persistent.session_code = None
    
    class GameAnalytics:
        def __init__(self):
            self.api_base = "https://your-api.railway.app/api/game"
            self.session_token = persistent.session_token
        
        def log_event(self, event_type, event_name=None, event_data=None):
            """Send event to backend API."""
            if not self.session_token:
                return  # Graceful degradation
            
            payload = {
                "session_token": self.session_token,
                "event_type": event_type,
                "event_name": event_name,
                "event_data": event_data or {}
            }
            
            # Use renpy.invoke_in_thread for non-blocking POST
            self._send_async(payload)
        
        def _send_async(self, payload):
            """Async HTTP request (implementation depends on web wrapper)."""
            # In web build: call JS bridge function
            # window.postMessage({ type: "analytics_event", data: payload })
            pass
        
        def verify_checkpoint(self, checkpoint_number):
            """Prompt student to re-enter code."""
            # Show custom input screen
            entered_code = renpy.call_screen("checkpoint_verify_screen", checkpoint_number)
            
            # Send to API for validation
            result = self._verify_checkpoint_api(checkpoint_number, entered_code)
            
            return result["valid"]
        
        def _verify_checkpoint_api(self, checkpoint_number, entered_code):
            """Sync API call for checkpoint verification."""
            # Implementation: POST to /api/game/checkpoint
            pass
    
    # Global analytics instance
    analytics = GameAnalytics()

# Screen for checkpoint verification
screen checkpoint_verify_screen(checkpoint_number):
    modal True
    frame:
        xalign 0.5
        yalign 0.5
        xsize 600
        ysize 300
        
        vbox:
            spacing 20
            xalign 0.5
            yalign 0.5
            
            text "Checkpoint {}/2".format(checkpoint_number):
                style "checkpoint_title"
            
            text "Please re-enter your access code to continue:":
                style "checkpoint_prompt"
            
            input:
                id "code_input"
                length 6
                allow "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
                style "checkpoint_input"
            
            hbox:
                spacing 10
                xalign 0.5
                
                textbutton "Verify":
                    action Return(code_input)
```

2. **Hook Points in Existing Scenes:**

#### [game/script.rpy](game/script.rpy)
```renpy
label start:
    # ADDED: Session start event
    $ analytics.log_event("session_start", event_data={"game_version": "1.0"})
    
    stop music fadeout 1.0 
    call inbed
    call hallway
    call hallwayafter
    call teachingfirst
    
    # ADDED: Checkpoint 1 verification
    $ checkpoint_passed = analytics.verify_checkpoint(1)
    if not checkpoint_passed:
        jump checkpoint_failed
    
    call teachingSecond
    
    # ADDED: Checkpoint 2 verification
    $ checkpoint_passed = analytics.verify_checkpoint(2)
    if not checkpoint_passed:
        jump checkpoint_failed
    
    call dragqns
    
    # ADDED: Session end event
    $ analytics.log_event("session_end", event_data={"completion": "full"})
    
    return

label checkpoint_failed:
    scene bg error
    "Unable to verify your access code. Please contact your instructor."
    return
```

#### [game/SceneScript/teaching1.rpy](game/SceneScript/teaching1.rpy)
```renpy
label teachingfirst:
    # ADDED: Scene entry event
    $ analytics.log_event("scene_enter", "teaching1", {"chapter": 1})
    
    # ... existing scene code ...
    
    menu:
        "Do you remember anything about Python's built-in functions?"
        "Yes":
            # ADDED: Choice tracking
            $ analytics.log_event("choice_selected", "builtin_yes", {"question": "remember_builtins"})
            call builInYes
        "No":
            # ADDED: Choice tracking
            $ analytics.log_event("choice_selected", "builtin_no", {"question": "remember_builtins"})
            call builtInNo
    
    # ... existing scene code ...
    
    return

label inputCheck:
    default answer = ""
    $ count = 3
    
    # ADDED: Quiz start event
    $ analytics.log_event("quiz_attempt", "quiz_int_output", {"attempt": 1})
    
    while count != 0:
        call screen custom_input("What will be the output?", "answer")
        $ outputIn = answer
        
        if outputIn == "2":
            # ADDED: Correct answer event
            $ analytics.log_event("quiz_result", "quiz_int_output", {
                "is_correct": True,
                "attempts_used": 4 - count,
                "answer": outputIn
            })
            with dissolve
            show ale speaking hand left side at aleAlign
            a "You got it right!"
            $ count = 0
        else:
            $ count -= 1
            if count == 0:
                # ADDED: Failed quiz event
                $ analytics.log_event("quiz_result", "quiz_int_output", {
                    "is_correct": False,
                    "attempts_used": 3,
                    "final_answer": outputIn
                })
                with dissolve
                show ale sad hand left side at aleAlign
                a "Kevin, you gave a wrong answer."
            else:
                call screen notiGuide(count)
                with dissolve
    return
```

#### [game/FrameNFunction/dragNDropFirst.rpy](game/FrameNFunction/dragNDropFirst.rpy)
```python
def submission():
    count = counter
    
    # ADDED: Assessment submission event
    renpy.store.analytics.log_event("assessment_submit", "drag_drop_main", {
        "answer_map": dict(dropBoxStates),
        "attempt": 1
    })
    
    if (dropBoxStates["box1"] != None and 
        dropBoxStates["box2"] != None and 
        dropBoxStates["box3"] != None and 
        dropBoxStates["box4"] != None and 
        dropBoxStates["box5"] != None):
        
        if (dropBoxStates["box1"] == "optC1" and
            dropBoxStates["box2"] == "optC2" and
            dropBoxStates["box3"] == "optC3" and
            dropBoxStates["box4"] == "optC4" and
            dropBoxStates["box5"] == "optC5"):
            
            # ADDED: Correct assessment event
            renpy.store.analytics.log_event("assessment_result", "drag_drop_main", {
                "is_correct": True,
                "answer_map": dict(dropBoxStates)
            })
            
            renpy.call("qnsSolved")
        else:
            # ADDED: Incorrect assessment event
            renpy.store.analytics.log_event("assessment_result", "drag_drop_main", {
                "is_correct": False,
                "answer_map": dict(dropBoxStates)
            })
            
            # Reset boxes
            for key in dropBoxStates:
                dropBoxStates[key] = None
            renpy.call("qnsUnsolve")
```

---

## 🌐 Frontend Implementation (Vercel)

### Student Portal

**File Structure:**
```
frontend/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── enter-code/
│   │   └── page.tsx             # Code entry page
│   ├── play/
│   │   └── page.tsx             # Game iframe container
│   └── api/
│       └── [...].ts             # API route proxies
├── components/
│   ├── CodeEntryForm.tsx
│   ├── GameEmbed.tsx
│   └── SessionExpiredModal.tsx
└── lib/
    ├── api-client.ts            # API wrapper
    └── session-manager.ts       # Session state management
```

**Key Components:**

**`app/enter-code/page.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { validateCode, startSession } from '@/lib/api-client';

export default function EnterCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Validate code
      const validation = await validateCode(code);
      
      if (!validation.valid) {
        setError('Invalid or disabled access code. Please check with your instructor.');
        setLoading(false);
        return;
      }

      // Step 2: Check if resume or new
      if (validation.can_resume) {
        const confirmResume = confirm('You have an existing session. Resume?');
        if (confirmResume) {
          // Resume session
          const resume = await resumeSession(code);
          window.location.href = `/play?token=${resume.session_token}`;
          return;
        }
      }

      // Step 3: Start new session
      const session = await startSession(code);
      window.location.href = `/play?token=${session.session_token}`;
      
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-600">
          The Path of Function
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Enter your access code to begin the interactive learning experience.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            pattern="[A-Z0-9]{6}"
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest uppercase focus:border-indigo-500 focus:outline-none"
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Validating...' : 'Start Game'}
          </button>
        </form>
        
        <p className="mt-6 text-xs text-gray-500 text-center">
          Don't have a code? Contact your instructor.
        </p>
      </div>
    </div>
  );
}
```

**`app/play/page.tsx`:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GameEmbed from '@/components/GameEmbed';

export default function PlayPage() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get('token');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!sessionToken) {
      window.location.href = '/enter-code';
      return;
    }

    // Verify session token is valid
    // (Optionally: call API to confirm token hasn't expired)
    
    setIsValid(true);
  }, [sessionToken]);

  if (!isValid) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <GameEmbed sessionToken={sessionToken} />
    </div>
  );
}
```

**`components/GameEmbed.tsx`:**
```typescript
'use client';

import { useEffect, useRef } from 'react';

interface GameEmbedProps {
  sessionToken: string;
}

export default function GameEmbed({ sessionToken }: GameEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Set up message listener for game analytics events
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'analytics_event') {
        // Forward to backend API
        fetch('/api/game/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...event.data.payload,
            session_token: sessionToken
          })
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionToken]);

  // URL to your Ren'Py WebGL build (can be itch.io or self-hosted)
  const gameUrl = `https://your-game-url.com?session_token=${sessionToken}`;

  return (
    <iframe
      ref={iframeRef}
      src={gameUrl}
      className="w-full h-screen border-0"
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
```

### Admin Portal

**File Structure:**
```
frontend/admin/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── codes/
│   │   ├── generate/
│   │   │   └── page.tsx
│   │   └── manage/
│   │       └── page.tsx
│   └── analytics/
│       └── page.tsx
└── components/
    ├── AdminLayout.tsx
    ├── CodeBatchTable.tsx
    ├── AnalyticsDashboard.tsx
    └── ExportButton.tsx
```

**`app/dashboard/page.tsx`:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsSummary } from '@/lib/api-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getAnalyticsSummary();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Research Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Codes Generated" 
          value={stats.total_codes_generated} 
          icon="📝"
        />
        <StatCard 
          title="Codes Used" 
          value={stats.codes_used} 
          subtitle={`${(stats.codes_used / stats.total_codes_generated * 100).toFixed(1)}% usage`}
          icon="✅"
        />
        <StatCard 
          title="Completed Sessions" 
          value={stats.completed_sessions} 
          icon="🎓"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Avg Completion Time" 
          value={`${stats.avg_completion_time_minutes} min`} 
          icon="⏱️"
        />
        <StatCard 
          title="Avg Quiz Accuracy" 
          value={`${(stats.quiz_avg_accuracy * 100).toFixed(1)}%`} 
          icon="📊"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-4xl">{icon}</span>
        <span className="text-3xl font-bold text-indigo-600">{value}</span>
      </div>
      <h3 className="text-gray-600 font-medium">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
```

**`app/codes/generate/page.tsx`:**
```typescript
'use client';

import { useState } from 'react';
import { generateCodes } from '@/lib/api-client';

export default function GenerateCodesPage() {
  const [formData, setFormData] = useState({
    batch_name: '',
    treatment_group: 'control',
    num_codes: 30,
    course_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await generateCodes(formData);
    
    // Download CSV immediately
    const blob = new Blob([result.csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes_${formData.batch_name.replace(/\s+/g, '_')}.csv`;
    a.click();
    
    alert(`Generated ${formData.num_codes} codes successfully!`);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Generate Access Codes</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Name *
          </label>
          <input
            type="text"
            value={formData.batch_name}
            onChange={(e) => setFormData({...formData, batch_name: e.target.value})}
            placeholder="e.g., Spring 2026 CSCI 2000"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treatment Group *
          </label>
          <select
            value={formData.treatment_group}
            onChange={(e) => setFormData({...formData, treatment_group: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="control">Control</option>
            <option value="intervention_A">Intervention A</option>
            <option value="intervention_B">Intervention B</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Codes *
          </label>
          <input
            type="number"
            value={formData.num_codes}
            onChange={(e) => setFormData({...formData, num_codes: parseInt(e.target.value)})}
            min="1"
            max="500"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Name (optional)
          </label>
          <input
            type="text"
            value={formData.course_name}
            onChange={(e) => setFormData({...formData, course_name: e.target.value})}
            placeholder="e.g., CSCI 2000 - Intro to Programming"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Generate Codes & Download CSV
        </button>
      </form>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Important Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Codes are 6-character alphanumeric (e.g., A7Q2M5)</li>
          <li>CSV will contain: Code, Name (blank for professor to fill)</li>
          <li>Keep the CSV secure - it contains access credentials</li>
          <li>Distribute codes to students via secure channel only</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 🚀 Implementation Timeline

### Phase 1: Foundation (Week 1-2)

**Week 1: Database + Backend Core**
- Day 1-2: Supabase setup, create all tables, configure RLS
- Day 3-4: FastAPI project setup, database connection, auth middleware
- Day 5-7: Implement admin endpoints (login, generate codes, export CSV)

**Week 2: Backend Completion**
- Day 1-3: Implement student endpoints (validate, start/resume session)
- Day 4-5: Implement game event ingestion + validation logic
- Day 6-7: Checkpoint verification logic + testing

### Phase 2: Frontend (Week 3-4)

**Week 3: Student Portal**
- Day 1-2: Next.js setup, code entry page
- Day 3-4: Game embed component + JS bridge
- Day 5-7: Session management, resume flow, error handling

**Week 4: Admin Portal**
- Day 1-2: Admin auth + dashboard layout
- Day 3-4: Code generation UI + batch management
- Day 5-6: Analytics dashboard + export functionality
- Day 7: UI polish + responsive design

### Phase 3: Ren'Py Integration (Week 5)

**Week 5: Analytics Bridge**
- Day 1-2: Create analytics.rpy, implement log_event()
- Day 3-4: Add hooks to existing scenes (script.rpy, teaching1.rpy, etc.)
- Day 5: Implement checkpoint verification screens
- Day 6-7: End-to-end testing + debugging

### Phase 4: Testing & Polish (Week 6)

**Week 6: Quality Assurance**
- Day 1-2: Integration testing (full student flow)
- Day 3: Load testing (simulate 30 concurrent students)
- Day 4: Security audit (injection, bypass attempts)
- Day 5: Privacy audit (verify no PII in logs)
- Day 6: Professor pilot test (dry run with test codes)
- Day 7: Documentation + deployment guides

**Total: 6 weeks for Phase 1 MVP**

---

## 🔐 Security & Privacy Considerations

### Authentication
- Admin: JWT tokens with 24-hour expiry
- Students: Session tokens with 7-day sliding window
- All API requests require valid tokens
- Rate limiting on all endpoints (prevent abuse)

### Data Protection
- **No PII stored:** Only anonymous access codes
- **Encrypted in transit:** HTTPS everywhere (Vercel/Railway default)
- **Encrypted at rest:** Supabase default encryption
- **Row-level security:** Prevent unauthorized data access
- **Audit logs:** Track all admin actions

### Compliance
- **FERPA:** No educational records linked to identities in system
- **IRB:** Prepare informed consent flow (if required)
- **GDPR:** Right to erasure support (delete session by code)

### Fraud Prevention
- One active session per code (configurable)
- Checkpoint verification prevents session hijacking
- IP + browser fingerprint logged (optional fraud detection)
- Reject out-of-sequence events server-side

---

## 📈 Analytics & Reporting

### Key Metrics Tracked

**Completion Metrics:**
- Total sessions started
- Sessions completed (reached end)
- Abandonment rate
- Avg completion time

**Learning Metrics:**
- Quiz accuracy per question
- Attempts before correct answer
- Assessment success rate (drag-drop)
- Retry patterns

**Engagement Metrics:**
- Time spent per scene
- Choice diversity (which branches selected)
- Checkpoint passage rate
- Resume rate (within 7 days)

**Research Comparisons:**
- Treatment group A vs B vs Control
- Pre-survey scores vs post-survey scores
- Gameplay pattern correlations

### Export Formats

**Admin Code Export CSV:**
```csv
Code,Name,TreatmentGroup,Status
A7Q2M5,,control,unused
K3XP9T,,control,used
M4LR8W,,intervention_A,used
```

**Research Data Export CSV:**
```csv
Code,TreatmentGroup,StartedAt,CompletedAt,DurationMinutes,QuizAccuracy,AssessmentPassed,CheckpointsVerified,SceneCount,ChoiceCount
A7Q2M5,control,2026-03-06T10:00:00Z,2026-03-06T10:42:15Z,42,0.83,TRUE,2,7,8
K3XP9T,control,2026-03-06T11:30:00Z,2026-03-06T12:08:45Z,38,0.67,FALSE,2,7,6
M4LR8W,intervention_A,2026-03-06T14:15:00Z,2026-03-06T15:02:30Z,47,0.92,TRUE,2,7,9
```

---

## 🤖 Future Phase 2/3: Vertex AI + RAG

### Architecture Placeholders (Implemented Now)

**Database additions:**
```sql
ALTER TABLE game_sessions ADD COLUMN ai_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE game_sessions ADD COLUMN ai_model_version TEXT;

CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id),
    interaction_type TEXT, -- hint_request, question, clarification
    student_input TEXT,
    ai_response TEXT,
    context_used JSONB, -- RAG context passages
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Backend scaffolding:**
```python
# backend/app/routers/ai.py (placeholder, not implemented yet)

from fastapi import APIRouter

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/chat")
async def chat_endpoint():
    """
    Future: Vertex AI + RAG endpoint
    Will accept student question, retrieve relevant context from VN content,
    generate personalized hint/explanation.
    """
    return {"message": "AI features coming in Phase 2"}
```

### When to Implement Phase 2

**Prerequisites:**
- Phase 1 fully deployed and tested
- At least 50 student sessions collected
- IRB approval for AI-assisted learning (if required)
- Budget allocated for Vertex AI API usage

**Implementation approach:**
1. Build RAG knowledge base from VN dialogue/teaching content
2. Integrate Vertex AI (or OpenAI) for response generation
3. Add `/api/ai/chat` endpoint with rate limiting
4. Add chat UI component in game or sidebar
5. A/B test: control group (no AI) vs intervention (AI hints)

---

## 📝 Documentation Deliverables

1. **This Document** - Comprehensive implementation plan
2. **API Documentation** - OpenAPI/Swagger spec (auto-generated by FastAPI)
3. **Database Schema** - ER diagram + table reference
4. **Deployment Guide** - Step-by-step setup for Vercel/Railway/Supabase
5. **Professor Handbook** - How to generate codes, distribute, export data
6. **Student FAQ** - Common issues, code entry help
7. **Privacy Policy** - What data is collected, how it's used
8. **Research Protocol** - For IRB submission (if needed)

---

## ✅ Success Criteria

### Technical Success
- [ ] System handles 50 concurrent students without errors
- [ ] 99.9% uptime during study period
- [ ] <2 second API response time (p95)
- [ ] Zero data loss incidents
- [ ] All checkpoint verifications logged correctly

### Research Success
- [ ] >80% code usage rate
- [ ] >70% session completion rate
- [ ] <10% data quality issues (missing events, out-of-order)
- [ ] Clean export format usable in R/SPSS/Python analysis
- [ ] Survey data successfully merged with gameplay data

### User Experience Success
- [ ] Students can enter code and start game in <30 seconds
- [ ] Zero reported issues with checkpoint verification
- [ ] Admin can generate and export codes in <2 minutes
- [ ] Professor finds analytics dashboard intuitive

---

## 🔧 Development Environment Setup

### Prerequisites
- Node.js 18+ (for Next.js frontend)
- Python 3.11+ (for FastAPI backend)
- PostgreSQL client (for Supabase)
- Git
- Ren'Py SDK 8.4.1

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

**Database:**
- Use Supabase cloud instance (free tier for dev)
- Or run local PostgreSQL: `docker run -p 5432:5432 postgres:15`

---

## 📞 Support & Maintenance

### During Study Period
- **Monitoring:** Set up Railway/Vercel alerts for downtime
- **Bug fixes:** <24 hour response time for critical issues
- **Data backup:** Daily automated backups in Supabase

### Post-Study
- **Data retention:** Keep raw data for 2 years (adjust per IRB)
- **Code archive:** Store all code batches + results
- **Documentation:** Update with lessons learned

---

## 🎉 Getting Started

### Immediate Next Steps

1. **Set up accounts:**
   - Vercel (free)
   - Railway (free tier)
   - Supabase (free tier)

2. **Clone repository structure:**
   ```bash
   mkdir path-of-function-research
   cd path-of-function-research
   git init
   mkdir backend frontend docs
   ```

3. **Create initial files:**
   - `backend/requirements.txt`
   - `backend/app/main.py`
   - `frontend/package.json`
   - `docs/API.md`

4. **Create Supabase project:**
   - Run schema SQL from this document
   - Note connection string

5. **Deploy hello-world:**
   - FastAPI: "Hello from backend"
   - Next.js: "Hello from frontend"
   - Verify Railway + Vercel deployments work

**Once accounts are set up, proceed to Phase 1 implementation (Week 1).**

---

## 📚 Additional Resources

- [Ren'Py Web Documentation](https://www.renpy.org/doc/html/web.html)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Guides](https://supabase.com/docs)
- [Educational Research Methods](https://methods.sagepub.com/)

---

**Document Version:** 1.0  
**Last Updated:** March 6, 2026  
**Next Review:** After Phase 1 completion

---

*This implementation plan is ready for execution. Proceed to creating the infrastructure files and beginning Phase 1 development.*
