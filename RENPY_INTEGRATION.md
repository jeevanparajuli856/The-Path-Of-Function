# Ren'Py Web Integration Guide

This guide explains how to integrate your Ren'Py game with the React frontend to enable checkpoint verification, event logging, and session management.

## Overview

The Ren'Py game runs in an `<iframe>` within the React app. Communication happens via the `postMessage()` API, allowing the Ren'Py game to:

1. **Request checkpoint codes** from the player
2. **Send game events** to the backend for logging
3. **Receive responses** about code verification
4. **Notify the frontend** when the game ends

## Message Format

### Ren'Py → React (Game Sending to Frontend)

```python
# In Ren'Py, send messages like this:
import time
import json

def send_message_to_frontend(event_type, payload):
    """Send a message to the React frontend via postMessage"""
    message = {
        "type": event_type,
        "payload": payload
    }
    js_code = f"window.parent.postMessage({json.dumps(message)}, '*')"
    renpy.run_action(js)  # This is pseudocode - see below for real implementation
```

### React → Ren'Py (Frontend Sending to Game)

```javascript
// In React/TypeScript, messages look like:
gameIframe.contentWindow.postMessage({
  type: "continue",
  payload: { checkpoint_number: 1 }
}, '*');
```

## Event Types & Payloads

### 1. Scene Start
**When**: Player enters a new scene

```python
send_message_to_frontend("scene_start", {
    "scene_name": "hallway_after",
    "timestamp": datetime.now().isoformat(),
    "current_scene": "hallway_after"  # Include for state tracking
})
```

### 2. Dialogue
**When**: Character speaks

```python
send_message_to_frontend("dialogue", {
    "character_name": "ale",
    "dialogue_text": "Hello, student!",
    "timestamp": datetime.now().isoformat()
})
```

### 3. Choice Made
**When**: Player selects a choice

```python
send_message_to_frontend("choice_made", {
    "choice_index": 0,
    "choice_text": "I want to learn about functions",
    "scene_name": "hallway",
    "timestamp": datetime.now().isoformat()
})
```

### 4. Checkpoint Reached
**When**: Player reaches a checkpoint location (IMPORTANT!)

```python
# ⚠️ CRITICAL: Send this BEFORE requesting the code
send_message_to_frontend("checkpoint_reached", {
    "checkpoint_number": 1,
    "scene_name": "teaching1",
    "checkpoint_description": "You've learned about function parameters",
    "timestamp": datetime.now().isoformat()
})

# Then request the code:
send_message_to_frontend("request_checkpoint_code", {
    "checkpoint_number": 1,
    "prompt_text": "Enter the code shown on the screen to continue:",
    "hint": "Look at the function definition",  # Optional
    "max_attempts": 3,
    "current_attempt": 1
})
```

### 5. Quiz Started
**When**: Player enters a quiz

```python
send_message_to_frontend("quiz_started", {
    "quiz_id": "q1_functions",
    "quiz_number": 1,
    "total_quizzes": 5,
    "question": "What is a parameter?",
    "options": [
        "A value passed to a function",
        "A return statement",
        "A variable name",
        "A syntax error"
    ]
})
```

### 6. Quiz Submitted
**When**: Player submits quiz answer

```python
send_message_to_frontend("quiz_submitted", {
    "quiz_id": "q1_functions",
    "answer_selected": 0,  # Index of selected option
    "is_correct": True,
    "score": 1,
    "total": 5,
    "timestamp": datetime.now().isoformat()
})
```

### 7. Game Ended
**When**: Game reaches completion

```python
send_message_to_frontend("game_ended", {
    "final_scene": "completion",
    "time_elapsed_minutes": 45,
    "checkpoints_passed": 2,
    "quizzes_completed": 5,
    "final_score": 85,
    "timestamp": datetime.now().isoformat()
})
```

## Frontend Responses

### Checkpoint Verified Response

When the frontend verifies a checkpoint code, it sends:

```python
# Code was correct:
{
    "type": "checkpoint_verified",
    "payload": {
        "checkpoint_number": 1,
        "verified": True,
        "attempts_remaining": 2
    }
}

# Code was incorrect:
{
    "type": "checkpoint_verified",
    "payload": {
        "checkpoint_number": 1,
        "verified": False,
        "attempts_remaining": 2
    }
}
```

In your Ren'Py, listen for this:

```python
def listen_for_verification(checkpoint_number):
    """Wait for checkpoint verification from frontend"""
    # Store the result globally or in game state
    # This is pseudocode - see bottom for real implementation
    verified = wait_for_message_type("checkpoint_verified", checkpoint_number)
    return verified
```

### Continue Command

After checkpoint/quiz, the frontend may send:

```python
{
    "type": "continue",
    "payload": {}
}
```

Your Ren'Py should detect this and move forward in the story.

## Implementation in Ren'Py

### Option 1: Using Built-in JavaScript

In `script.rpy` or a module:

```python
# Define at the top of your script
init python:
    import json
    import time
    from datetime import datetime
    
    # Global state for communication
    _renpy_messages = []
    _last_frontend_message = None
    
    def send_to_frontend(event_type, payload):
        """Send a message to the React frontend"""
        message = {
            "type": event_type,
            "payload": payload
        }
        # Use Ren'Py's JavaScript integration
        renpy.invoke_in_new_context(renpy.log, f"[FRONTEND] {json.dumps(message)}")
        # Alternative: write to a log file that the frontend polls (if direct JS unavailable)
        
    def checkpoint_code_input(checkpoint_number, prompt_text, max_attempts=3):
        """Ask the player to enter a checkpoint code"""
        send_to_frontend("request_checkpoint_code", {
            "checkpoint_number": checkpoint_number,
            "prompt_text": prompt_text,
            "max_attempts": max_attempts,
            "current_attempt": 1
        })
        
        # In production, you'd wait for the frontend response
        # For now, show a placeholder
        
screen checkpoint_prompt(checkpoint_number, prompt_text):
    modal True
    zorder 100
    
    frame:
        xpos 0.5
        ypos 0.5
        xanchor 0.5
        yanchor 0.5
        
        vbox:
            text "Code Required:"
            text prompt_text
            input default "" changed_action Return(None)
            
            hbox:
                textbutton "Submit" action Return(True)
                textbutton "Cancel" action Return(False)
```

### Option 2: Direct postMessage (More Reliable)

If Ren'Py is built for web, modify your web build setup:

```html
<!-- In the HTML file hosting your Ren'Py game -->
<script>
window.addEventListener('message', function(event) {
    // Message from React frontend
    const message = event.data;
    console.log('Ren\'Py received:', message);
    
    // You can store this for Ren'Py to access
    window.lastFrontendMessage = message;
    
    // Or trigger an event that Ren'Py can listen to
    window.dispatchEvent(new CustomEvent('frontend-message', { detail: message }));
});

// Function for Ren'Py to call
window.sendToFrontend = function(type, payload) {
    window.parent.postMessage({
        type: type,
        payload: payload
    }, '*');
};
</script>
```

Then in Ren'Py:

```python
# At the start of the game, inject JavaScript
label start:
    $ renpy.call_in_new_context('setup_frontend_communication')
    
label setup_frontend_communication:
    python:
        # Initialize communication with frontend
        def send_to_frontend(event_type, payload):
            import json
            # Call the JavaScript function we defined
            js_payload = json.dumps({"type": event_type, "payload": payload})
            renpy.run(f"sendToFrontend('{event_type}', {js_payload})")
```

### Option 3: Event Logging Pattern

```python
# Simpler approach - log events as they happen
label teaching1:
    scene bg_classroom
    show ale speaking
    
    # Log scene start
    python:
        send_to_frontend("scene_start", {
            "scene_name": "teaching1",
            "current_scene": "teaching1"
        })
    
    ale "Good morning! Let's learn about function parameters."
    
    python:
        send_to_frontend("dialogue", {
            "character": "ale",
            "text": "Good morning! Let's learn about function parameters."
        })
    
    # Some gameplay...
    
    # Checkpoint reached
    python:
        send_to_frontend("checkpoint_reached", {
            "checkpoint_number": 1,
            "description": "Understood function parameters"
        })
    
    "You've reached a checkpoint!"
    "The code is: FUNC123"
    
    # Request code from player
    python:
        send_to_frontend("request_checkpoint_code", {
            "checkpoint_number": 1,
            "prompt_text": "Enter the code shown above:",
            "max_attempts": 3,
            "current_attempt": 1
        })
    
    # Show a screen and wait for input
    call screen get_checkpoint_code("FUNC123") # Or verify via backend
    
    if _return:  # Code was correct
        "Excellent! You've verified the checkpoint."
        jump checkpoint1_passed
    else:
        "Incorrect code. Try again."
        jump teaching1
    
    label checkpoint1_passed:
        python:
            send_to_frontend("checkpoint_verified", {
                "checkpoint_number": 1,
                "verified": True
            })
        
        jump teaching2
```

## Checkpoint Code Handling Strategy

### Strategy 1: Hardcoded Codes (Recommended for Testing)

```python
# In your Ren'Py script
define CHECKPOINT_CODES = {
    1: "FUNC123",
    2: "FUNC456",
    3: "FUNC789"
}

label verify_checkpoint(checkpoint_number):
    python:
        correct_code = CHECKPOINT_CODES.get(checkpoint_number)
        
        send_to_frontend("request_checkpoint_code", {
            "checkpoint_number": checkpoint_number,
            "prompt_text": f"Enter the code to unlock checkpoint {checkpoint_number}:",
            "max_attempts": 3,
            "current_attempt": 1
        })
    
    # Display a screen for code entry
    call screen checkpoint_code_entry(checkpoint_number)
    
    if _return == correct_code:
        "✓ Correct!"
        python:
            send_to_frontend("checkpoint_passed", {
                "checkpoint_number": checkpoint_number
            })
        return True
    else:
        "✗ Incorrect code. Try again."
        return False
```

### Strategy 2: Verify with Backend (Recommended for Production)

The React frontend handles verification via the API, so Ren'Py just needs to send the code the player entered:

```python
label verify_checkpoint(checkpoint_number):
    python:
        send_to_frontend("request_checkpoint_code", {
            "checkpoint_number": checkpoint_number,
            "prompt_text": f"Enter the code shown on screen:",
            "max_attempts": 3,
            "current_attempt": 1
        })
    
    # Show input screen
    call screen checkpoint_code_entry
    user_code = _return
    
    # Send to frontend for verification (React will handle it)
    python:
        send_to_frontend("checkpoint_code_submitted", {
            "checkpoint_number": checkpoint_number,
            "code_entered": user_code
        })
    
    # Wait for verification response
    # Frontend will send "checkpoint_verified" message when done
```

## Testing the Integration

### 1. Test Message Sending

In Ren'Py console, test:

```python
renpy.run("sendToFrontend('test_event', {'message': 'Hello from Ren\'Py'})")
```

Check React DevTools console for the message.

### 2. Monitor Messages in Browser

Open Chrome DevTools → Console, add:

```javascript
window.addEventListener('message', (e) => {
    console.log('Message from Ren\'Py:', e.data);
});
```

### 3. Test Game Endpoint

With the game page open, verify API calls are being logged:

```bash
curl -X POST http://localhost:8000/api/game/event \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "YOUR_SESSION_TOKEN",
    "event_type": "scene_enter",
    "event_data": {"scene_name": "test_scene"}
  }'
```

## Troubleshooting

### Messages Not Reaching Frontend

- Check browser console for errors
- Verify iframe `allow="fullscreen"` attribute
- Check origin/CORS settings
- Use web inspector to watch Network traffic

### Code Verification Not Working

- Ensure checkpoint numbers match (1, 2, etc.)
- Check that frontend receives `request_checkpoint_code` event
- Verify codes in backend match Ren'Py codes (FUNC123, FUNC456)
- Check browser console for JavaScript errors

### Game Not Loading

- Ensure Ren'Py web build is at `/public/game/index.html`
- Check that file paths are correct
- Run web build in HTTPS (some browsers restrict file:// protocols)
- Check browser console for loading errors

## Summary

1. **Ren'Py sends** game events to React via `postMessage()`
2. **React receives** events and:
   - Shows checkpoints prompts when needed
   - Verifies codes with backend
   - Logs all events to database
3. **Frontend sends** responses back to Ren'Py:
   - `checkpoint_verified` - result of code verification
   - `continue` - signal to move to next scene
4. **All events** are logged to the backend database for analytics

This enables full tracking of gameplay while keeping the Ren'Py game self-contained in an iframe.
