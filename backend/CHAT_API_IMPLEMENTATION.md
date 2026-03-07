# Chat API Integration - Implementation Guide

## Overview

The `/api/chat` endpoint implements a Vertex AI RAG (Retrieval-Augmented Generation) powered helper chatbot integrated into the game. Students can ask questions while playing, and the AI provides game-grounded answers with proper sourcing and spoiler guardrails.

**Key Features:**
- ✅ RAG-grounded responses (only answers from game corpus)
- ✅ Citation tracking (which game scenes/content answer the question)
- ✅ Spoiler guardrails (respects learning progression)
- ✅ Help policy enforcement (hint-only mode, help limits, etc)
- ✅ Full research audit trail (every interaction logged to database)
- ✅ Unified data collection alongside game events

---

## Architecture

### Data Flow

```
Student Question
    ↓
[POST /api/chat/message]
    ↓
{session_token, user_message, game_context}
    ↓
[Guardrail Check] → Validate question, check help limits, detect spoilers
    ↓
[RAG Query] → Vector search game corpus for relevant content
    ↓
[Prompt Building] → Construct LLM prompt with game tone + grounding
    ↓
[Vertex AI Gemini] → Generate response
    ↓
[Citation Extraction] → Map sources to RAG results
    ↓
[Log to Database] → Save interaction for research audit trail
    ↓
[Return Response] → JSON with text, citations, guardrail info
```

### Endpoints

#### 1. **POST /api/chat/message** (Main)
Generate AI response to student question

**Request:**
```json
{
  "session_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_message": "What does a function do in programming?",
  "game_context": {
    "scene_id": "scene_001_intro",
    "topic_id": "function_basics",
    "learning_objective": "Understand what functions are and why they're useful",
    "player_state": {"level": 1, "completed_scenes": ["scene_intro"]},
    "help_policy": "hint"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "response": "A function is a reusable block of code that performs a specific task...",
  "citations": [
    {
      "source_type": "scene",
      "source_id": "scene_001_intro",
      "relevance_score": 0.95,
      "excerpt": "Functions are the foundation of programming..."
    }
  ],
  "guardrail_applied": false,
  "guardrail_mode": "none",
  "help_remaining": 9,
  "chat_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "message_id": "msg_550e8400-e29b-41d4-a716-446655440001"
}
```

**Error Response:**
```json
{
  "detail": "Chat request validation failed: Help limit exceeded"
}
```

#### 2. **GET /api/chat/history** (Retrieval)
Get chat history for current session

**Query Parameters:**
- `limit`: Max messages to return (default: 50)

**Response:**
```json
{
  "success": true,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2024-03-07T10:30:00Z",
      "user_message": "What is a loop?",
      "assistant_response": "A loop is a programming structure that...",
      "scene_id": "scene_002",
      "topic_id": "loops",
      "guardrail_applied": false,
      "guardrail_mode": "none",
      "citations": [...]
    }
  ],
  "total_count": 3
}
```

#### 3. **GET /api/chat/export/session/{session_id}** (Research Export)
Export complete chat data for analysis

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "chat_count": 5,
  "messages": [
    {
      "id": "msg_1",
      "timestamp": "2024-03-07T10:30:00Z",
      "user_message": "What is a function?",
      "assistant_response": "Functions are reusable code blocks...",
      "game_context": {
        "scene_id": "scene_001",
        "topic_id": "function_basics",
        "learning_objective": "...",
        "player_state": {...},
        "help_policy": "default"
      },
      "response_metadata": {
        "guardrail_mode": "none",
        "response_tokens": 125,
        "citations": [...]
      }
    }
  ],
  "export_timestamp": "2024-03-07T15:00:00Z"
}
```

---

## Database Schema

### ChatLog Table

```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  student_id VARCHAR(255),
  access_code VARCHAR(50),
  
  -- Student input
  user_message TEXT NOT NULL,
  
  -- AI response
  assistant_response TEXT NOT NULL,
  
  -- Game context at query time
  game_scene_id VARCHAR(100),
  game_topic_id VARCHAR(100),
  learning_objective TEXT,
  player_state JSONB,
  help_policy VARCHAR(50),
  
  -- Response metadata
  citations JSONB,  -- [{source_type, source_id, relevance_score, excerpt}]
  guardrail_mode VARCHAR(50),
  response_tokens INTEGER,
  
  created_at TIMESTAMP NOT NULL,
  INDEX (session_id),
  INDEX (student_id),
  INDEX (game_scene_id)
);
```

---

## Implementation Status

### ✅ Completed

1. **API Endpoint** (`app/api/chat.py`)
   - POST `/api/chat/message` - Generate responses
   - GET `/api/chat/history` - Retrieve conversation history
   - GET `/api/chat/export/session/{session_id}` - Export research data

2. **Data Models**
   - `ChatLog` model with full schema
   - Relationship to `GameSession` for audit trail linking

3. **Schemas** (`app/schemas/chat.py`)
   - `ChatMessageRequest` - Input validation
   - `ChatMessageResponse` - Response formatting
   - `ChatContextData` - Game state context
   - `CitationSource` - Source attribution

4. **Vertex AI Service** (`app/services/vertex_ai.py`)
   - Framework for RAG integration
   - Guardrail checking logic
   - Prompt building with game tone
   - Citation extraction

5. **Configuration**
   - `GCP_PROJECT_ID` in settings
   - `.env.example` with Vertex AI config
   - `requirements.txt` with dependencies

6. **Route Registration**
   - Chat router imported and included in `main.py`
   - Added to `/api/chat` prefix

### ⚠️ TODO (Phase 2)

1. **Real Vertex AI Vector Database Setup**
   - Create Vertex AI Vector Search index
   - Populate with game corpus (scenes, glossary, examples)
   - Implement actual embedding + vector search in `_query_rag_corpus()`

2. **Game Corpus Preparation**
   - Extract scene content from Ren'Py scripts
   - Create glossary with programming terms
   - Add quiz rationale/explanations
   - Compile tone guidelines + teaching approach

3. **Real Vertex AI API Integration**
   - Replace mock implementation in `_call_vertex_ai()`
   - Use actual Gemini model
   - Add token counting for cost tracking
   - Set up proper error handling

4. **Guardrail Implementation**
   - Help limit tracking per session
   - Spoiler detection classification
   - Out-of-scope question routing
   - Hint-mode response formatting

5. **Ren'Py Bridge Enhancement**
   - Emit extended events: `learning_context_update`, `player_state_update`, `help_policy_update`
   - Send `learning_objective` and `help_policy` with each game event

6. **Frontend Chat UI**
   - Collapsible chat sidebar on game page
   - Theme-matched styling (game colors/fonts)
   - Message display with sources
   - Spinner/loading state
   - Error handling

7. **Testing & Debugging**
   - Unit tests for guardrail logic
   - Integration tests with mock Vertex AI
   - End-to-end flow testing

---

## Configuration Required

### Environment Variables

Add to `.env`:
```bash
# Google Cloud
GCP_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-1.5-flash

# For local development:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### Google Cloud Setup (Once-Only)

```bash
# 1. Create GCP project
gcloud projects create path-of-function

# 2. Enable Vertex AI + Vector Search APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable vectorsearch.googleapis.com
gcloud services enable storage.googleapis.com

# 3. Create service account
gcloud iam service-accounts create bot-service-account \
  --display-name="Chat Bot Service Account"

# 4. Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:bot-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/aiplatform.user

# 5. Create and download key
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=bot-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com

# 6. Update your .env
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/sa-key.json"
```

### Dependencies

Install Vertex AI packages:
```bash
pip install -r requirements.txt
# Or manually:
pip install google-cloud-aiplatform>=1.42.0 vertexai>=0.44.0
```

---

## Integration with Game

### From Frontend (React)

Call the chat endpoint from game page:

```typescript
// frontend/lib/api.ts

export async function chatMessage(
  sessionToken: string,
  userMessage: string,
  gameContext: {
    scene_id?: string;
    topic_id?: string;
    learning_objective?: string;
    player_state?: Record<string, any>;
    help_policy?: string;
  }
): Promise<ChatMessageResponse> {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_token: sessionToken,
      user_message: userMessage,
      game_context: gameContext,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  return response.json();
}

// In ChatWindow.tsx or new <ChatOverlay> component
const response = await chatMessage(sessionToken, 'What is a function?', {
  scene_id: 'scene_001',
  topic_id: 'function_basics',
  player_state: gameState,
  help_policy: 'hint'
});

// Display response with citations
console.log(response.response);
console.log(response.citations);
console.log(response.guardrail_applied);
```

### From Ren'Py

When emitting game events, include extended context:

```python
# game/script.rpy (existing)
# When entering a scene:
_send_event("scene_start", {
    "scene_id": "scene_001",
    "scene_name": "Introduction to Functions",
})

# NEW: When learning objective changes
_send_event("learning_context_update", {
    "topic_id": "function_basics",
    "learning_objective": "Understand what functions are and why they're useful",
    "scene_id": "scene_001",
})

# NEW: When help policy changes
_send_event("help_policy_update", {
    "help_policy": "hint",  # 'full', 'hint', 'restricted'
    "reason": "student_requested",
    "help_requests_remaining": 9,
})

# Existing: When choices are made
_send_event("choice_made", {
    "choice_text": "Learn about functions",
    "scene_id": "scene_001",
})

# On quiz attempts
_send_event("player_state_update", {
    "quizzes_attempted": 1,
    "correct_answers": 1,
    "scene_id": "scene_001",
})
```

---

## Research Data Collection

All chat interactions are automatically logged and linked to:
- **Game Session** (session_id)
- **Student** (student_id via access_code)
- **Time** (created_at timestamp)
- **Game Context** (scene_id, topic_id, learning_objective, player_state, help_policy)
- **Response Quality** (guardrail_mode, token_count, citations)

### Accessing Research Data

**Simple query** - Get all chat for a session:
```sql
SELECT user_message, assistant_response, guardrail_mode, created_at
FROM chat_logs
WHERE session_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at;
```

**Complete audit trail** - Export endpoint:
```bash
GET /api/chat/export/session/550e8400-e29b-41d4-a716-446655440000
```

**Aggregated analysis** - Questions by topic:
```sql
SELECT game_topic_id, COUNT(*) as question_count
FROM chat_logs
WHERE created_at > NOW() - INTERVAL 7 days
GROUP BY game_topic_id;
```

---

## Guardrail Modes

| Mode | Behavior | Example |
|------|----------|---------|
| `none` | Full answer provided | Question: "What's a function?" → Full explanation |
| `hint` | Only hints, no solutions | Question: "How do I solve this?" → Hints only |
| `spoiler` | Avoids plot details | Question: "What happens in scene 5?" → Generic guidance |
| `out_of_scope` | Redirects to game topics | Question: "What's the weather?" → "Let's focus on..." |

---

## Testing Checklist

- [ ] POST /api/chat/message with valid context
- [ ] Check response contains all required fields
- [ ] Verify citations match RAG results
- [ ] Test guardrail modes (hint, spoiler, out_of_scope)
- [ ] GET /api/chat/history returns chronological messages
- [ ] GET /api/chat/export works with research data
- [ ] Database ChatLog entries created for each interaction
- [ ] Session token validation works
- [ ] Invalid contexts are rejected gracefully
- [ ] Vertex AI API errors handled properly

---

## Next Steps

1. **Setup Google Cloud**
   - Create project, enable APIs, setup service account
   
2. **Populate RAG Corpus**
   - Extract game content into vector database
   - Test embedding quality with sample questions

3. **Implement Vertex AI Calls**
   - Replace mock functions with real API calls
   - Test response generation

4. **Build Frontend Chat UI**
   - Create chat overlay component
   - Integrate with game page

5. **Test End-to-End**
   - Ask questions in game
   - Verify citations and guardrails
   - Check research data logging

---

## Files Modified/Created

**New Files:**
- `app/api/chat.py` - Chat endpoint implementation
- `app/schemas/chat.py` - Chat request/response schemas
- `app/models/chat.py` - ChatLog database model
- `app/services/vertex_ai.py` - Vertex AI integration service
- `app/services/__init__.py` - Services package init

**Modified Files:**
- `app/main.py` - Added chat router import + registration
- `app/models/session.py` - Added chat_logs relationship
- `requirements.txt` - Added Vertex AI dependencies
- `.env.example` - Added GCP_PROJECT_ID config
- `app/core/config.py` - Added GCP settings

---

## Support

**Vertex AI Documentation:**
- https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/gemini-sdk

**Vector Search:**
- https://cloud.google.com/vertex-ai/docs/vector-search/overview

**RAG Patterns:**
- https://cloud.google.com/vertex-ai/docs/generative-ai/retrieval-augmented-generation/overview
