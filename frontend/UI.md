Your project already has a **very strong visual identity** (anime classroom, soft beige dialogue box, playful characters). The main challenge now is **making the website UI feel like the same world as the game** so the transition to the Ren'Py WebGL iframe feels seamless.

Since your goal is research + learning UX, the design should feel like **a playful classroom interface**, not a typical tech dashboard.

I'll break this into **3 parts**:
1️⃣ Overall visual direction
2️⃣ Landing page layout (website UI)
3️⃣ Chatbot + game overlay integration

---

# 1. Core Visual Direction (Unify Web + Game)

Right now the website looks **modern tech dark theme**, but the game looks **anime classroom playful theme**.

They feel like **two different products**.

You should move the website toward the **game’s aesthetic**.

### Game aesthetic

* warm beige dialogue boxes
* soft classroom backgrounds
* anime characters
* playful shapes
* rounded UI

### Website aesthetic (current)

* dark tech gradient
* square UI
* SaaS style layout

👉 Instead, use **“Playful Learning Interface”**

### Color Palette

Take colors from your game UI.

Primary palette:

```
Background: #F7F3EA (soft classroom paper)
Primary: #6AA6D9 (soft blue)
Accent: #C9A899 (dialogue box beige)
Highlight: #9DD2FF (sparkle blue)
Text: #2E2E2E
```

Avoid dark backgrounds.

Make it feel like **a digital classroom board**.

---

# 2. Landing Page Design

## Hero Section Idea

Instead of only text, create a **scene like the game**.

Layout suggestion:

```
 -------------------------------------------------
|                                                 |
|         Emma (left)       Kevin (right)         |
|                                                 |
|                PATH OF FUNCTION                 |
|         Learn Programming Through Story         |
|                                                 |
|                 [ Enter Game ]                  |
|                                                 |
 -------------------------------------------------
```

Characters facing each other like a **conversation**.

Emma → teacher helper
Kevin → student learner

That creates **story context immediately**.
so for that we have #frontend\assets\banner.png which is the banner image with both characters and the title in the middle

---


# 3. Navigation UI

Make navigation look like **game menu UI**.

Instead of normal navbar:

```
Start Game
About
```

Styled like **visual novel buttons**.

Rounded + soft shadow.

---

# 4. Game Page Layout

When user clicks **Enter Game**, open a dedicated game page.

Structure:

```
 -------------------------------------
|           GAME HEADER               |
|-------------------------------------|
|                                     |
|           RenPy WebGL               |
|            (iframe)                 |
|                                     |
|                                     |
|-------------------------------------|
|                         Emma Chatbot
 -------------------------------------
```

The iframe should feel embedded, not separate. like it real and look like its there itself

Then, emma chat bot is the flaoitng assistant but it should look like it part of the renpy game itself, so it should have the same dialogue box style and the avatar should be the same as the in game emma

---

# 5. Chatbot UI Design (Very Important)



Emma itself is the  **guide character**.

### Chatbot UI Layout

Bottom-right floating assistant.

```
        frontend\assets\chatbot\chatIcon.png whichi sthe chat box icon 
```

Click avatar → expands chatbot.

---

## Expanded Chatbot Panel

┌─────────────────────────────┐
│ Emma AI Tutor               │
│                             │
│   😊 Emma                  │ #thats the avatar which is in  frontend\assets\chatbot
│                             │
│ A function is a reusable    │
│ block of code.              │
│                             │
│ _________________________   │
│ Ask Emma something...       │
└─────────────────────────────┘

The input box is in frontend\assets\chatbot\chatbox.png

---
When the chatbot responds, it selects the appropriate Emma expression.

Example mapping:
The Emma avatar inside the chatbot panel should change based on the conversation context
Situation	Emma Expression
User opens chatbot	🙂 Idle
User asks a question	🤔 Thinking
Explaining concept	😊 Explaining
User confusion detected	😅 Confused

# 6. Chatbot + Game Integration

This is **AI tutoring**.


---

# 7. Small RAG Knowledge Base

We have small rag implementation will place so look the code how we are collecting data for it too. so chat bot will work on it. 
---

# UI Flow
 -User visit site, they enter code, then, it will laod the game page then, user keep on playing then, if they click on chatbot, they can ask question and get answer based on the context of the game and also based on the rag knowledge base. so it will be very helpful for them to understand the concept and also to keep them engaged in the game.
--

# 13. Font Choice

Use font from the #game itself for UI text.