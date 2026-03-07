# The Path of Function - Detailed Game Script

This document captures the current in-game wording from the live Ren'Py source under `game/`.
It is structured for print review and future wording edits.

## Characters
- `Kevin` (student)
- `Emma` (guide)
- `Teacher`

## Runtime Scene Order
1. `start` -> `inbed`
2. `hallway`
3. `hallwayafter`
4. `teachingfirst`
5. `teachingSecond`
6. `dragqns`
7. `qnsSolved` or `qnsUnsolve`
8. `puzzleExplaination` (always reached)
9. `afterDragNDrop`
10. `ending`

## Act 1 - Before Wake Up (`game/SceneScript/BeforeWakeup.rpy`)

### Dialogue
1. Teacher: "Kevin, You failed the last Introduction to Programming exam. This isn't acceptable, you need to start taking this classes seriously!"
2. Teacher: "Kevin?... Kevin?...Kevin?... Kevin?..."
3. Teacher: "Are you even listening to me?"
4. Kevin: "Ugh, another nightmare! Why does Introduction to Programming keep haunting me? Why is it so impossible to figure out?"
5. Kevin: "Oh no! It's already 8 AM! Only 30 minutes until class. I've got to move fast!"
6. Kevin: "Phew! I actually made it on time. That was way too close!"
7. Kevin: "Functions? What are function? Sounds like another boring topic I'll never understand or remember..."
8. Teacher: "There will be a test on functions in the next class, so make sure you're prepared."
9. Kevin: "A test? Already? You've got to be kidding me! I really need to figure this out... Guess I'll ask Emma for help again."

## Act 2 - Hallway Encounter (`game/SceneScript/hallwayscene.rpy`)

### Dialogue
1. Kevin: "Hey, Emma!"
2. Emma: "Hi, Kevin! What's up?"
3. Kevin: "Not much. Just trying to survive our Introduction to programming class."
4. Emma: "Is there anything I can do for help?"
5. Kevin: "That would be great!!! I'm struggling. Functions have me completely lost."
6. Emma: "Oh no! Don't worry, I've got your back."
7. Kevin: "You're the Introduction to programming  queen! Do you have time later today to go over function material discussed in class together??"
8. Emma: "Of course! Where do you want to meet and at what time?"
9. Kevin: "The computer science lab should be free after 5 P.M. Does that work for you?"
10. Emma: "Perfect! I'll meet you there."
11. Emma: "See you later, Kevin!"
12. Kevin: "See you, Emma! And thanks, you're the best!"

## Act 3 - Transition to Study Session (`game/SceneScript/hallwayafter.rpy`)

### Dialogue
1. Kevin: "Hi, Emma! Thank you so much for coming. I really appreciate it."
2. Emma: "Of course! Now, let's head to lab and get started."

## Act 4 - Teaching Part 1 (`game/SceneScript/teaching1.rpy`)

### Core Dialogue
1. Emma: "Let me pull up my Function presentation on the projector, it'll make understanding functions a lot easier."
2. Emma: "I'll explain each slide and feel free to stop me if you have questions."
3. Kevin: "Alright, Emma! I'm ready to tackle this."
4. Emma: "Let's do this!"
5. Emma: "Today's topic is functions in Python."
6. Emma: "But before we dive in, Kevin, let me ask you question."
7. Emma: "Do you remember anything about Python's built-in functions?"

### Choice 1
Prompt: "Do you remember anything about Python's built-in functions?"
- Option `Yes` -> `builInYes`
- Option `No` -> `builtInNo`

#### Branch `builInYes`
1. Kevin: "Yeah, I remember a little about them. Honestly, it's one of the few things I managed to focus on in class today."
2. Emma: "Great! Let's quickly review those topics to make sure everything's crystal clear."

#### Branch `builtInNo`
1. Kevin: "Nope, today's lecture went completely over my head."
2. Emma: "That's okay, Kevin. Don't worry, I'll walk you through it step by step."

### Continued Dialogue
1. Emma: "Now let me sit down with you, and we'll get started with Python's built-in functions."
2. Emma: "Python has many built-in functions. Think of a function as a mini-program, it takes an input, processes it, and gives you an output."
3. Emma: "Let me show you an example."
4. Emma: "Here you go, the 'int()' function."
5. Emma: "This function takes a number as input and returns an integer by removing the decimal part."
6. Emma: "Now let me give you another example using the int() function."
7. Emma: "Here, let's use a diagram to visualize how the variable 'a' is assigned value."
8. Emma: "In this case, we're assigning 'a' the value returned by int(2.6)."
9. Emma: "Next, the variable 'a' is passed as an argument to another function, print()."
10. Emma: "Let me ask you a question."
11. Emma: "Kevin, can you tell me what the output of this small program will be?"

### Question 2 - Input Check (`label inputCheck`)
Prompt shown: "What will be the output?"
- Max attempts: `3`
- Correct answer: `2`
- Wrong-answer notification text: "Ouch!! It's wrong answer you have [chance] more chance left!!"

Response lines:
- On correct: Emma: "You got it right!"
- On final failure: Emma: "Kevin, you gave a wrong answer."

### Continued Dialogue
1. Emma: "The answer is 2 because we passed the variable 'a' to print() as argument, and its value is 2."
2. Emma: "Let's step it up a notch. Do you know anything about user-defined functions?"
3. Kevin: "Uh... not really. Did the professor even mention that?"
4. Emma: "Kevin, where was your head during class? The professor explained this for so long!"
5. Emma: "Sorry, Emma! I don't know why I can't focus in that class. You're literally my only hope right now."
6. Emma: "Alright, alright! Let's not waste time. Let's talk about user-defined functions!"
7. Emma: "User-defined functions are lifesavers! They help you avoid repeating the same code and break down big problems into smaller, manageable chunks."
8. Emma: "And the best part? You can reuse them whenever similar problems show up elsewhere in your program. Think of it as building your personal toolkit."
9. Emma: "Let me show you the basic syntax of a user-defined function."
10. Emma: "Here's what the basic syntax looks like."
11. Emma: "Notice the word 'def'? That's the magic keyword for defining a function."
12. Emma: "Next, you give your function a name. Make it descriptive, so you know what it does but, none of that 'function123' nonsense!"
13. Emma: "After the name, you add parentheses. Inside these, you can define zero or more formal parameters. Think of formal parameter as placeholders for the data your function will work with."
14. Emma: "Parameters work on a 'pass by position' system, meaning the order of the parameters is super important."
15. Emma: "When you call a function in your program, you must pass as many actual values as there are formal parameters. These actual values are matched with the formal parameters in the same order."
16. Emma: "Now, inside the function, you write the code that does the actual work. It could be calculations, printing, or whatever task you need."
17. Emma: "Finally, there's the return statement. The return statement sends the defined value back to the calling program."
18. Emma: "Got it so far? Great! Now, let me show you an example of a user-defined function."
19. Emma: "Let me step outside for a moment and test your understanding."
20. Emma: "Take a look at this example. Can you tell me the name of the function?"

### Choice 3 - Function Name
Prompt: "What is the name of the function here?"
- Option `fahrenheit` -> `fahrNo`
- Option `fahrenheitToCelsius` -> `fahrYes`

#### Branch `fahrYes`
1. Kevin: "It's fahrenheitToCelsisus."
2. Emma: "That's right! You've got it, my friend."
3. Emma: "The function name is fahrenheitToCelsius, and fahrenheit is its formal parameter. Great job catching that!"

#### Branch `fahrNo`
1. Kevin: "It's fahrenheit"
2. Emma: "Not quite, Kevin. That's the formal parameter, not the function name."
3. Emma: "Think back to the syntax I just explained. The formal parameter goes inside the parentheses, and the function name comes before it."
4. Emma: "The correct function name is fahrenheitToCelsius. Don't worry, you'll get it next time!"

### Continued Dialogue
1. Emma: "Le's dive deeper into the 'fahrenheitToCelsius' function."
2. Emma: "I'll sit beside you to explain this in detail."
3. Emma: "As you know, fahrenheit is the formal parameter. This means that when we call the function in the program, we need to pass a actual value for fahrenheit parameter."
4. Emma: "Inside the function body, there's a statement that converts the value held by formal parameter-fahrenheit to celsius value. The celsius value is stored in a variable called celsius."
5. Emma: "Here's your next challenge: What value will the function fahrenheitToCelsius return to calling program when an value of 98 is passed to function"

### Question 4 - Celsius Value (`label valcheck`)
Prompt shown: "What will be the value hold by celsius?"
- Max attempts: `3`
- Correct accepted answers: `36.67`, `36.7`, `37`, `36.66`
- Wrong-answer notification text: "Ouch!! It's wrong answer you have [chance] more chance left!!"

Response lines:
- On correct: Emma: "You got it. Right answer!"
- On final failure: Emma: "Kevin, It's not a right answer."

### Continued Dialogue
1. Emma: "When we pass 98 as the argument, the second statement in the function converts the Fahrenheit value into Celsius and assigns it to the variable \"celsius\"."
2. Emma: "The 'round()' method is used to limit the decimal value of the variable 'celsius' to two decimal places."
3. Emma: "Now let's take a closer look at the return statement in the 'fahrenheitToCelsius' function."
4. Emma: "At the end of the function, there's a return statement. This statement sends the value of 'celsius' back to calling program"
5. Emma: "This way, the converted Celsius value can be used elsewhere in the program. Neat, right?"

## Act 5 - Teaching Part 2 (`game/SceneScript/teaching2.rpy`)

### Dialogue
1. Emma: "What do you think, Kevin? Will this program execute or not?"

### Choice 5 - Program Execution
Prompt: "Will this program execute?"
- Option `Yes` -> `exYes`
- Option `Confused` -> `exConfused`

#### Branch `exYes`
1. Kevin: "Yes, I think this program is going execute."
2. Emma: "That's right, Kevin! Good job."

#### Branch `exConfused`
1. Kevin: "I am confused, Emma. I don't think this program is going to execute."
2. Emma: "I get why it seems confusing at first. Let me break it down for you step by step."

### Continued Dialogue
1. Emma: "Ths program will get executed and allow a user to input a number, which will be stored in the variable **temp**."
2. Emma: "For example, if the user inputs 100, the variable 'temp' will hold the value 100."
3. Emma: "Next, the fahrenheitToCelsius() function is called, passing the value of 'temp' as the argument."
4. Emma: "The value return by fahrenheitToCelsius() function is stored in another variable called **celsius**, which in this case will be 37.78."
5. Emma: "After that, the print() statement execute to display the result. Inside print(), str() converts the Celsius value into a string, and chr(176) converts the ASCII code 176 into the degree symbol (deg)."
6. Emma: "However, let me point out something important."
7. Emma: "It's not a good practice to write the main logic of a program, like the last three lines in this example, outside a specific block."
8. Emma: "Instead, it's better to encapsulate the main logic within a `main()` function"
9. Emma: "This is the where the concept of using main() function comes in."
10. Emma: "Inside the main() function, we write the main logic of the program. It helps organize and direct the flow of the program effectively."
11. Emma: "Let me show you an example of using a 'main()' function."
12. Emma: "The syntax is similar to any other user-defined function."
13. Emma: "We start with the def keyword, followed by main()."
14. Emma: "Then, we include the main logic of the program inside the function."
15. Emma: "Let me ask you a question."
16. Emma: "Do you know how to call the main() function to execute the program?"
17. Kevin: "Yeah, I think we need to write main() at the end of the code to call the function and execute it."
18. Emma: "Exactly, Kevin! Without calling it, the main() function won't execute on its own."
19. Emma: "After defining the main() function, we need to call it, usually at the end, after all the statements have been written."
20. Emma: "As you can see on the screen, 'main()' is called right after its definition. When it's called, it executes all the statements within its body."
21. Emma: "Does this help you understand the concept of function definitions and function calls?"
22. Kevin: "Yeah, it's all starting to make sense now!"
23. Emma: "That's great to hear, Kevin! Before we move on to the next chapter, let's do a quick challenge."
24. Emma: "I'll show you a question on the screen where you'll need to drag and drop the correct blocks to complete a Python program."
25. Emma: "Are you ready?"

### Choice 6 - Ready for Challenge
Prompt: "Are you ready?"
- Option `Yes` -> `qnsYes`
- Option `No` -> `qnsNo`

#### Branch `qnsYes`
1. Kevin: "I'm ready for this challenge!"
2. Emma: "That's the spirit! Here's your question. Take your time, and remember, you only get one chance to get it right!"

#### Branch `qnsNo`
1. Kevin: "No, I'm not sure I'm ready yet."
2. Emma: "That's perfectly fine, Kevin. Remember, this is all about learning, and it's okay to feel unsure sometimes."
3. Emma: "Just do your best. If you get stuck, don't worry-I'll guide you through the solution step by step."
4. Kevin: "Alright Emma, I am ready now."
5. Emma: "Great! Here's the question on your screen."

## Act 6 - Drag and Drop Challenge (`game/FrameNFunction/dragNDropFirst.rpy`)

### Player Task Wording
- From Emma (previous scene): "I'll show you a question on the screen where you'll need to drag and drop the correct blocks to complete a Python program."

### Submission Logic (wording-relevant summary)
- If all 5 boxes are filled with the correct sequence (`optC1`..`optC5`) -> call `qnsSolved`
- Otherwise -> call `qnsUnsolve`

Correct mapping:
1. `box1` -> `optC1`
2. `box2` -> `optC2`
3. `box3` -> `optC3`
4. `box4` -> `optC4`
5. `box5` -> `optC5`

## Act 7A - After Submission (Solved Path) (`label qnsSolved`)

### Dialogue
1. Emma: "That's awesome, Kevin! You did it!"
2. Emma: "You got all the answers right. I'm so proud of you!"
3. Kevin: "Thank you, Emma! I couldn't have done it without you."
4. Kevin: "Really, all the credit goes to you."
5. Emma: "Oh, stop it! You're the one who put in all the effort."
6. Emma: "But hey, would you like me to go over the answer to this question just to make sure everything's clear?"

### Choice 7 - Explanation Offer (Solved)
Prompt: "Do you want Emma to explain you the answer to the question?"
- Option `Yes` -> `yesExplain`
- Option `No` -> `noExplain`

#### Branch `yesExplain`
1. Kevin: "Yeah, for sure. That'll make everything clearer."
2. Continue to `puzzleExplaination`

#### Branch `noExplain`
1. Kevin: "I feel pretty confident now."
2. Kevin: "I don't want to take up more of your time."
3. Emma: "Alright, Kevin. You did great today."
4. Continue to `afterDragNDrop`

## Act 7B - After Submission (Unsolved Path) (`label qnsUnsolve`)

### Dialogue
1. Emma: "Oops, that's not quite right, Kevin! Looks like you got a bit stuck in the middle."
2. Emma: "No worries, let me help you figure this out step by step."
3. Kevin: "Yeah, Emma, I got a bit confused halfway through. Thanks for stepping in!"
4. Continue to `puzzleExplaination`

## Act 8 - Puzzle Explanation (`label puzzleExplaination`)

### Dialogue
1. Emma: "Let me sit beside you and explain the solution to that question."
2. Emma: "Let's start with the first box. It's for the function declaration, which calculates the area of a rectangle."
3. Emma: "We can confirm this from the print() statement inside the main() block."
4. Emma: "There are two options for the function definition, but we'll pick the first box: def calculate_area(length, width)."
5. Emma: "The second option only uses width, but to calculate the area, we need both length and width."
6. Emma: "Next is the second box. This box contains the core logic of the function: multiplying length and width and storing the result in the variable area."
7. Emma: "Since the function clearly returns area, the correct option for this box is area = length * width."
8. Emma: "Now, let's move to the main() function. The first box in the main() block is for variable declaration."
9. Emma: "Since we're calculating the area of a rectangle, we need to declare a variable for length."
10. Emma: "At this point, the correct answer could be length = 10 or len = 10, but let's solve the next box to confirm."
11. Emma: "Box 4 is for calling the calculate_area() function and assigning its result to the area variable, which is printed afterward."
12. Emma: "The correct option for this box is area = calculate_area(length, width), since the other option only passes width, which isn't valid."
13. Emma: "Now let's go back to Box 3. Since length is used as a parameter in the function call in Box 4, we can confidently say the correct answer for Box 3 is `length = 10`"
14. Emma: "Finally, the last box remains. We've completed the main() block, but to execute the program, we need to call main()."
15. Emma: "The correct answer for the last box is main()."
16. Emma: "I know it looks a bit long, but trust me, it's simple once you break it down step by step."
17. Kevin: "Thank you so much for making this crystal clear."

## Act 9 - Call Stack Lesson (`label afterDragNDrop`)

### Dialogue
1. Emma: "There's one more topic to cover before we call it a day, it's important to understand how Python handles function calls behind the scences."
2. Emma: "Let's talk about the call stack."
3. Emma: "The call stack is a special part of memory that Python uses to remember which function it's currently working on, and where to return when it's done."
4. Emma: "You can imagine it like a stack of boxes or a pile of books."
5. Emma: "Let me with you and show it on the screen."
6. Emma: "As you can see, the first function that gets called is main(). It goes at the bottom of the stack."
7. Emma: "main() starts executing. Eventually, it reaches the line that calls calculate_area(length, width) "
8. Emma: "Now, Python places calculate_area() on top of the stack."
9. Emma: "Python begins executing calculate_area(). When it reaches the return statement, the value of area is sent back to main()"
10. Emma: "The calculate_area() is now completed, so it's popped off the stack."
11. Emma: "Python always runs the function at the top of the stack. When that function finishes, Python pops it off the stack and then continues running the function that's now on top."
12. Emma: "It's like opening notebooks one at a time, top to bottom, and then closing them in reverse."
13. Emma: "The *area* variable in the main function is assigned with the return value from calculate_area() function so, in this case, the *area* variable receives a value of 50"
14. Emma: "When main() finishes executing, it's removed from the stack too."
15. Emma: "And now, the stack is empty!"
16. Emma: "Alright, Kevin. One last check before we end the session."
17. Emma: "Which function was the last to be removed from the stack?"

### Final Question - Stack Pop Order
Prompt: "Which function was the last to be removed from the stack?"
- Option `calculate_area()` -> `lastWrong`
- Option `main()` -> `lastCorrect`

#### Branch `lastCorrect`
1. Emma: "Correct! main() was the last to be removed after it finished executing. Great job remembering the flow!"

#### Branch `lastWrong`
1. Emma: "Close, but not quite. calculate_area() was removed first when right after it returned a value. The last one to go was main()."

## Act 10 - Ending (`label ending`)

### Dialogue
1. Emma: "And that brings us to the end of today's session"
2. Kevin: "Wow.... I can't believe how much I learned in just one day. I actually understand functions now!"
3. Emma: "You've done amazing, Kevin. You just needed the right push, and a little patience."
4. Kevin: "Thanks to you, I finally feel ready for tomorrow's exam."
5. Emma: "Remember, programming is all about solving problems step by step. You've got this."
6. Kevin: "I'll review everything again tonight, but yeah, I'm feeling confident."
7. Emma: "Let's pack up and head home."
8. Emma: "Bye-bye, Kevin! See you tomorrow in class."
9. Emma: "And hey, all the best for the exam!"
10. Kevin: "You too, Emma. You're the best, you're going to crush the exam."
11. Emma: "Come on, Kevin. Alright, see you tomorrow!"
12. Kevin: "She really is the best. I'm going to give it everything tomorrow."
13. Kevin: "it's already 6! I better head home now."
14. End text: "Thank you for Playing and Learning!"

## Appendix A - Input and Notification UI Text

### Custom Input Screen (`game/screens.rpy`)
- Prompt variable rendered as text: `prompt`
- User input length: `32`

### Notification Screen (`game/FrameNFunction/notification.rpy`)
- "Ouch!! It's wrong answer you have [chance] more chance left!!"

## Appendix B - Learning Objectives Used In Script

The following objective strings are used during gameplay:
1. "Understand what Python built-in functions do and how to use them."
2. "Understand user-defined function structure and purpose."
3. "Understand formal parameters and argument passing by position."
4. "Understand how return statements send values back to the caller."
5. "Understand main() function organization pattern"
6. "Understand call stack push/pop order during function calls"

## Source Files Used
- `game/script.rpy`
- `game/SceneScript/BeforeWakeup.rpy`
- `game/SceneScript/hallwayscene.rpy`
- `game/SceneScript/hallwayafter.rpy`
- `game/SceneScript/teaching1.rpy`
- `game/SceneScript/teaching2.rpy`
- `game/FrameNFunction/dragNDropFirst.rpy`
- `game/SceneScript/afterSubmission.rpy`
- `game/screens.rpy`
- `game/FrameNFunction/notification.rpy`
