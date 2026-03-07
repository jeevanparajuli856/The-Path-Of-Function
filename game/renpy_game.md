# The Path of Function - Game Documentation

## Project Overview
**Title:** The Path of Function  
**Engine:** Ren'Py  
**Genre:** Educational Visual Novel  
**Theme:** Python Programming - Functions  

An interactive educational game where Kevin learns about Python functions with help from his classmate Emma. The game uses visual novel mechanics combined with interactive programming challenges.

---

## Character Definitions

All characters are defined in `game/script.rpy`:

```python
define k = Character("Kevin")    # Main protagonist, struggling student
define e = Character("Emma")     # Kevin's helpful classmate (previously 'a')
define t = Character("Teacher")  # Programming instructor
```

**Character Roles:**
- **Kevin (k)**: Player identification character, learning programming concepts
- **Emma (e)**: Mentor/tutor character, explains programming concepts
- **Teacher (t)**: Appears in dream/flashback sequences

---

## Game Flow & Scene Structure

### Main Scene Flow
Located in `game/script.rpy` - label `start`:

```
BeforeWakeup -> hallwayscene -> hallwayafter -> teaching1 -> teaching2 -> afterSubmission
```

**Flow Breakdown:**
1. **inbed** (BeforeWakeup.rpy) - Kevin's nightmare about failing, morning alarm
2. **hallway** (hallwayscene.rpy) - Kevin meets Emma, asks for help
3. **hallwayafter** (hallwayafter.rpy) - They agree to meet at 5 PM in the lab
4. **teachingfirst** (teaching1.rpy) - Built-in functions & user-defined functions
5. **teachingSecond** (teaching2.rpy) - main() function, program execution
6. **dragqns** (FrameNFunction/dragNDropFirst.rpy) - Interactive drag & drop quiz
7. **qnsSolved/qnsUnsolve** (afterSubmission.rpy) - Quiz results handling
8. **ending** (afterSubmission.rpy) - Conclusion, Kevin's confidence restored

---

## Complete Label Reference

### Scene Labels (Primary Flow)

| Label | File | Purpose |
|-------|------|---------|
| `start` | script.rpy | Game entry point |
| `inbed` | BeforeWakeup.rpy | Opening nightmare & morning scene |
| `hallway` | hallwayscene.rpy | Kevin meets Emma in hallway |
| `hallwayafter` | hallwayafter.rpy | Transition to teaching lab |
| `teachingfirst` | teaching1.rpy | First teaching session |
| `teachingSecond` | teaching2.rpy | Second teaching session |
| `dragqns` | dragNDropFirst.rpy | Drag & drop puzzle |
| `qnsSolved` | afterSubmission.rpy | Correct answer path |
| `qnsUnsolve` | afterSubmission.rpy | Incorrect answer path |
| `ending` | afterSubmission.rpy | Game conclusion |

### Teaching 1 Sub-Labels (teaching1.rpy)

| Label | Purpose | Type |
|-------|---------|------|
| `builInYes` | Response to knowing built-in functions | Choice branch |
| `builtInNo` | Response to not knowing built-in functions | Choice branch |
| `fahrYes` | Correct answer: fahrenheitToCelsius | Choice branch |
| `fahrNo` | Wrong answer: fahrenheit parameter | Choice branch |
| `inputCheck` | Custom input validation (what's the output?) | Interactive input |
| `valcheck` | Custom input validation (celsius value) | Interactive input |

### Teaching 2 Sub-Labels (teaching2.rpy)

| Label | Purpose | Type |
|-------|---------|------|
| `exYes` | Understands program will execute | Choice branch |
| `exConfused` | Confused about program execution | Choice branch |
| `qnsYes` | Ready for challenge | Choice branch |
| `qnsNo` | Not ready for challenge | Choice branch |

### After Submission Sub-Labels (afterSubmission.rpy)

| Label | Purpose | Type |
|-------|---------|------|
| `yesExplain` | Wants explanation of answer | Choice branch |
| `noExplain` | Doesn't need explanation | Choice branch |
| `puzzleExplaination` | Detailed solution walkthrough | Explanation |
| `afterDragNDrop` | Call stack concept teaching | Lesson |
| `lastCorrect` | Correct answer: main() last removed | Choice branch |
| `lastWrong` | Wrong answer: calculate_area() | Choice branch |

---

## File Structure

```
game/
├── script.rpy                    # Main entry point, character definitions
├── options.rpy                   # Game configuration
├── screens.rpy                   # UI definitions
├── gui.rpy                       # GUI customization
├── renpy_game.md                 # This documentation file
│
├── SceneScript/                  # All game scenes
│   ├── BeforeWakeup.rpy         # Opening scene
│   ├── hallwayscene.rpy         # Hallway meeting
│   ├── hallwayafter.rpy         # Lab transition
│   ├── teaching1.rpy            # Functions lesson pt. 1
│   ├── teaching2.rpy            # Functions lesson pt. 2
│   └── afterSubmission.rpy      # Quiz results & ending
│
├── FrameNFunction/              # Custom functions & screens
│   ├── dragNDropFirst.rpy      # Drag & drop puzzle implementation
│   └── notification.rpy         # Error notification system
│
├── images/                      # Visual assets
│   ├── ale package/            # Emma character sprites
│   ├── bg/                     # Background images
│   ├── dragqns/                # Drag & drop question images
│   ├── dragopt/                # Drag & drop option images
│   ├── dropbox/                # Drop box images
│   ├── fahren ex/              # Fahrenheit example images
│   ├── mainfn/                 # main() function examples
│   ├── notification/           # Notification UI elements
│   ├── Stack/                  # Call stack visualization
│   ├── teaching/               # Teaching slide images
│   ├── userdefine/             # User-defined function examples
│   └── userdefine fahren/      # Fahrenheit function examples
│
├── audio/                       # Audio assets
│   ├── dream.mp3               # Dream sequence music
│   ├── morningalaram.mp3       # Alarm sound
│   ├── CollegeBell2.mp3        # College bell sound
│   ├── classroom.mp3           # Classroom ambience
│   ├── hallway.mp3             # Hallway ambience
│   ├── learning.mp3            # Study session music
│   └── teachingclass.mp3       # Teaching ambience
│
├── font/                        # Custom fonts
├── gui/                         # GUI assets
├── saves/                       # Save file storage
└── cache/                       # Ren'Py cache files
```

---

## Custom Functions & Screens

### Drag & Drop System (FrameNFunction/dragNDropFirst.rpy)

**Purpose:** Interactive Python code assembly puzzle

**Key Components:**
- `screen drag_drop` - Main drag & drop interface
- `dragged_func(dragged_items, dropped_on)` - Handles drag behavior
- `submission()` - Validates submitted answer
- `dropBoxStates{}` - Dictionary tracking dropped items

**Drop Boxes:**
1. box1 - Function definition
2. box2 - Function body logic
3. box3 - Variable declaration in main()
4. box4 - Function call
5. box5 - main() function call

### Notification System (FrameNFunction/notification.rpy)

**Purpose:** Display error feedback with remaining chances

**Screen:** `notiGuide(chance)`
- Shows wrong answer notification
- Displays remaining attempts
- Auto-dismisses after 3 seconds
- Styled with custom noti_styles

### Input Validation System

**inputCheck Label (teaching1.rpy):**
- Custom input screen for "What will be the output?"
- Validates answer: "2"
- 3 attempts with notification feedback
- Uses `custom_input` screen

**valcheck Label (teaching1.rpy):**
- Custom input for Celsius calculation
- Accepts: "36.67", "36.7", "37", "36.66"
- 3 attempts with notification feedback

---

## Interactive Elements

### User Input Points

1. **Built-in Functions Knowledge** (teaching1.rpy)
   - Menu choice: Yes/No
   - Branches to different dialogue

2. **Function Name Identification** (teaching1.rpy)
   - Menu: "fahrenheit" or "fahrenheitToCelsius"
   - Educational feedback on answer

3. **Output Prediction** (teaching1.rpy)
   - Text input: Expected answer "2"
   - 3 attempts with feedback

4. **Celsius Value Calculation** (teaching1.rpy)
   - Text input: Multiple acceptable answers
   - 3 attempts with feedback

5. **Program Execution Understanding** (teaching2.rpy)
   - Menu: Yes/Confused
   - Determines explanation depth

6. **Challenge Readiness** (teaching2.rpy)
   - Menu: Yes/No
   - Affects encouragement dialogue

7. **Drag & Drop Puzzle** (dragNDropFirst.rpy)
   - Interactive code assembly
   - Single submission attempt

8. **Explanation Request** (afterSubmission.rpy)
   - Menu: Yes/No
   - Controls solution walkthrough

9. **Call Stack Knowledge** (afterSubmission.rpy)
   - Menu: calculate_area()/main()
   - Final comprehension check

---

## Visual Assets Organization

### Character Sprites (images/ale package/)
Emma's expressions and poses:
- Standing variations (hand positions)
- Speaking variations
- Question poses
- Explaining poses
- Emotional states (blush, sad)
- Bye/wave animations

**Naming Convention:** `ale [emotion] [pose description]`
Example: `ale speaking hand both wrist`

### Background Images (images/bg/)
- `bg dream` - Dream sequence
- `bg 8am` - Morning alarm
- `bg wakeup2` - Kevin waking up
- `bg classentry` - Entering classroom
- `bg teacher writing/explaining` - Teacher scenes
- `bg after30` - 30 minutes later
- `bg hallway` - School hallway
- `bg classroom` - Computer lab
- `bg 5pm` - Evening transition
- `bg road` - Outside school
- `bg ale final bye` - Ending scene

### Teaching Materials (images/teaching/, userdefine/, etc.)
- Function syntax diagrams
- Code examples with highlights
- int() function examples
- fahrenheitToCelsius examples
- main() function examples
- Stack visualization sequences

---

## Position & Transform Definitions

```python
# hallwayscene.rpy
aligner = Position(xpos=550, xanchor=10, ypos=-10, yanchor=1)

# teaching1.rpy
aleAlign = Position(xpos=600, xanchor=0, ypos=-60, yanchor=1)

# teaching2.rpy
aleAlign = Position(xpos=650, xanchor=2, ypos=-60, yanchor=1)

# afterSubmission.rpy
finalAlign = Transform(zoom=0.9, xpos=0.5, xanchor=0.5, ypos=0.9, yanchor=0.6)
```

---

## Audio System

### Music Loops
- `dream.mp3` - Dream sequence (fadein/out 1.0s)
- `classroom.mp3` - Classroom ambience (fadein 1.0s, fadeout 2.0s)
- `hallway.mp3` - Hallway ambience (fadein 1.0s, fadeout 2.0s)
- `learning.mp3` - Study session (fadein 1.0s, fadeout 2.0s)
- `teachingclass.mp3` - Teaching class (fadein 1.0s, fadeout 2.0s)

### Sound Effects (Voice Channel)
- `morningalaram.mp3` - Alarm clock (fadein/out 2.0s)
- `CollegeBell2.mp3` - Class bell (fadein/out 2.0s)

**Implementation Pattern:**
```python
play sound "filename.mp3" fadein 1.0 fadeout 2.0 loop
play voice "filename.mp3" fadein 2.0 fadeout 2.0
```

---

## Database Integration Points (Future Development)

### Planned Database Features

#### 1. User Progress Tracking
**Tables Needed:**
- `users` - User accounts
- `progress` - Scene completion tracking
- `quiz_attempts` - Input validation attempts
- `drag_drop_results` - Puzzle completion data

**Integration Points:**
- Label `start` - Load user progress
- Label `ending` - Save completion state
- `inputCheck` - Log attempt data
- `valcheck` - Log attempt data
- `dragqns` - Log puzzle results

#### 2. Learning Analytics
**Metrics to Track:**
- Time spent per scene
- Number of attempts per quiz
- Menu choices (learning style indicators)
- Areas of confusion (wrong answers)
- Completion rate

**Key Labels for Analytics:**
- `teachingfirst`, `teachingSecond` - Lesson engagement time
- `inputCheck`, `valcheck` - Assessment performance
- `dragqns` - Puzzle solving time
- All menu choices - Learning preferences

#### 3. Adaptive Content
**Personalization Opportunities:**
- Skip sections if user demonstrates knowledge
- Provide additional examples based on wrong answers
- Adjust difficulty of dragqns based on previous performance
- Recommend review sessions

**Implementation Areas:**
- Modify `builInYes`/`builtInNo` branches based on past performance
- Dynamic hint system in `dragqns`
- Personalized encouragement in Emma's dialogue

#### 4. Content Management
**Dynamic Content Loading:**
- Teaching slides from database
- Multiple puzzle variations
- Randomized quiz questions
- Updated programming examples

**Files to Enhance:**
- `teaching1.rpy` - Load examples from DB
- `teaching2.rpy` - Load exercises from DB
- `dragNDropFirst.rpy` - Load puzzle variations

---

## Database Schema Suggestions

### Users Table
```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    created_at TIMESTAMP,
    last_played TIMESTAMP
);
```

### Progress Table
```sql
CREATE TABLE progress (
    progress_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    label_name TEXT,
    completed BOOLEAN,
    completion_time TIMESTAMP,
    time_spent INTEGER,  -- seconds
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### Quiz Attempts Table
```sql
CREATE TABLE quiz_attempts (
    attempt_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    quiz_label TEXT,  -- inputCheck, valcheck, etc.
    attempt_number INTEGER,
    user_answer TEXT,
    is_correct BOOLEAN,
    attempted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### Drag Drop Results Table
```sql
CREATE TABLE drag_drop_results (
    result_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    box1_answer TEXT,
    box2_answer TEXT,
    box3_answer TEXT,
    box4_answer TEXT,
    box5_answer TEXT,
    is_correct BOOLEAN,
    time_taken INTEGER,  -- seconds
    submitted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### Menu Choices Table
```sql
CREATE TABLE menu_choices (
    choice_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    label_name TEXT,
    choice_text TEXT,
    chosen_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## Backend Integration Points

### API Endpoints Needed

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `GET /api/auth/session` - Check session validity

#### Progress Management
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress/save` - Save progress checkpoint
- `PUT /api/progress/complete/:labelName` - Mark label complete

#### Quiz/Assessment
- `POST /api/quiz/attempt` - Log quiz attempt
- `GET /api/quiz/results/:userId` - Get user's quiz history
- `POST /api/dragdrop/submit` - Submit drag & drop results

#### Analytics
- `GET /api/analytics/user/:userId` - User learning analytics
- `GET /api/analytics/aggregate` - Aggregate stats across users
- `POST /api/analytics/event` - Log custom learning events

### Ren'Py Integration Pattern
```python
init python:
    import requests
    import json
    
    def save_progress(user_id, label_name):
        try:
            response = requests.post(
                "http://localhost:8000/api/progress/save",
                json={
                    "user_id": user_id,
                    "label_name": label_name,
                    "timestamp": time.time()
                }
            )
            return response.json()
        except Exception as e:
            # Handle offline mode
            return {"status": "offline"}
```

---

## Transition Effects Used

### Fade Transitions
- `with fade` - Standard scene transition
- `with dissolve` - Smooth character/image transition
- `Fade(1.0, 3.5, 0.9)` - Custom fade timing
- `Fade(0.5, 1, 0.5)` - Quick fade

### Special Transitions
- `with zoomin` - Zoom in effect
- `with moveinleft` - Move from left (error notification)
- `with Pause(X)` - Timed pause

---

## Development Notes

### Recent Changes
- Changed Emma's character variable from `a` to `e` across all files
- Consistent dialogue formatting
- Added comprehensive labeling system

### Code Style Guidelines
1. Use descriptive label names
2. Comment scene transitions
3. Include pause timings for dramatic effect
4. Consistent character positioning (use defined Positions)
5. Always include sound fadeout to prevent abrupt audio stops

### Testing Checklist
- [ ] All labels accessible from start
- [ ] All menu choices lead to valid labels
- [ ] Input validation works (3 attempts)
- [ ] Drag & drop submission logic
- [ ] Audio loops properly
- [ ] Character sprites display correctly
- [ ] All images load without errors
- [ ] Transitions smooth and timed correctly

### Known Issues / TODO
- [ ] Add backend API integration
- [ ] Implement user authentication
- [ ] Add progress saving functionality
- [ ] Create multiple puzzle variations
- [ ] Add skip functionality for repeat players
- [ ] Implement analytics tracking
- [ ] Add accessibility features (text-to-speech)
- [ ] Create achievement system
- [ ] Add replay value with branching paths

---

## Performance Optimization

### Image Optimization
- Use WebP format for backgrounds (smaller file size)
- Sprite sheets for character animations
- Lazy loading for teaching material images

### Audio Optimization
- OGG format for music loops (better compression)
- MP3 for short sound effects
- Preload frequently used sounds

### Code Optimization
- Use persistent variables for user data
- Cache drag & drop state
- Minimize file read operations

---

## Localization Preparation

### Text Extraction Points
All dialogue text should be extractable for translation:
- Character dialogue
- Menu options
- Input prompts
- Notification messages
- UI text

### Files Requiring Localization
- All .rpy files in SceneScript/
- notification.rpy (error messages)
- dragNDropFirst.rpy (instructions)
- Teaching material images (code examples)

---

## Version Control Notes

### Critical Files to Track
- All .rpy files (code)
- options.rpy (game config)
- Database schema files
- API integration code

### Files to Ignore
- *.rpyc (compiled files)
- saves/ (user save data)
- cache/ (Ren'Py cache)
- __pycache__/

---

## Contact & Contribution

**Project Structure:** Modular scene design allows easy addition of new lessons
**Extension Points:** Add new SceneScript files and call from appropriate labels
**Custom Functions:** Add to FrameNFunction/ folder

### Adding New Scenes
1. Create new .rpy file in SceneScript/
2. Define main label
3. Add call to appropriate parent label
4. Include return statement
5. Test flow from start label

### Adding New Interactive Elements
1. Create screen in FrameNFunction/
2. Define Python functions if needed
3. Add label for result handling
4. Include in appropriate scene flow

---

**Last Updated:** 2026-03-07  
**Ren'Py Version:** 7.x+  
**Python Version:** 3.x 
