define aleAlign = Position(xpos = 650, xanchor = 2, ypos=-60, yanchor=1)
label teachingSecond:

    #Now second part of teaching
    scene bg classroom with dissolve
    show fahren with dissolve
    show ale standing hand both wrist at aleAlign with dissolve
    show ale question hand both down at aleAlign with dissolve
    a "What do you think,Kevin? Will this program execute or not?" #Askign the qns
    menu: #Choice for the qns
        "Will this program execute?"
        "Yes":
            call exYes
        "Confused":
            call exConfused

    #Explaining how the funciton gonna execute
    scene bg classroom with fade
    show fahren2 explain with dissolve
    a "Ths program will get execute and allow a user to input a number, which will be stored in a variable."
    show fahren2 input with dissolve
    a "For example, if the user inputs 100, the variable 'temp' will hold the value 100."
    show fahren2 funcall with dissolve
    a "Next, the fahrenheitToCelsius() function is called, passing the value of 'temp' as the argument."
    show fahren2 returns with dissolve
    a "The returned value form fahrenheitToCelsius() is stored in another variable called celsius, which in this case will be 37.78."
    show fahren2 print with dissolve
    a "After that, the print() statement executes to display the result."
    a "However, let me point out something important."
    show fahren2 last3 with dissolve
    a "It's not a good practice to write the main logic of a program—like the last three lines in this example—outside a specific block."
    a "Instead, it's better to encapsulate the main logic within a `main()` function or similar."

    #Starting main() function concept
    a "This is the where the concept of using main() function comes in."
    hide fahren2 
    show mains with dissolve
    a "Inside the main() function, we write the main logic of the program. It helps organize and direct the flow of the program effectively."
    a "Let me show you an example of using a 'main()' function."
    hide mains
    show main examp behind ale with dissolve 
    a "The syntax is similar to any other user-defined function."
    show main def with dissolve
    a "We start with the def keyword, followed by main()."
    show main bodyst with dissolve
    a "Then, we include the main logic of the program inside the function."

    #Second block of explanation
    a "Let me come over there and ask you a question."
    show ale standing hand left side at aleAlign with fade
    show ale question hand both down with dissolve 
    a "Do you know how to call the main() function to execute the program?"
    show ale standing hand both wrist with dissolve
    k "Yeah, I think we need to write main() at the end of the code to call the function and execute it."
    show ale speaking hand both wrist with dissolve
    a "Exactly, Kevin! Without calling it, the main() function won't execute on its own."
    show ale standing hand one fold with dissolve
    show ale speaking hand one fold with dissolve
    a "After defining the main() function, we need to call it, usually at the end, after all the statements have been written."
    show main cal with dissolve
    show ale explaining hand left up with dissolve
    a "As you can see on the screen, 'main()' is called right after its definition. When it's called, it executes all the statements within its body."
    show ale speaking hand left side with dissolve
    a "Does this help you understand the concept of function definitions and function calls?"
    show ale standing hand left side with dissolve
    k "Yeah, it's all starting to make sense now!"

    #Last qns section
    show ale speaking hand left side with dissolve
    a "That's great to hear, Kevin! By the way, it's already 6 PM. Let's wrap up for today with one last question."
    show ale speaking hand together with dissolve
    a "Tomorrow morning, we'll dive into an exciting topic: understanding how memory allocation happens in the stack when a program and its functions are executed."
    show ale standing hand both fold with dissolve
    k "Sounds great! Let's meet at 8 AM tomorrow morning."
    show ale speaking hand both fold with dissolve
    a "That works perfectly for me."
    show ale speaking hand both wrist with dissolve
    a "Now, I'll show you a question on the screen where you'll need to drag and drop the correct blocks to complete a Python program."
    show ale question hand both down with dissolve
    a "Are you ready?"
    menu:
        "Are you ready?"
        "Yes":
            call qnsYes
        "No":
            call qnsNo

    with Fade(0.5,1,0.5)
    call dragqns ## drang and drop qns call
    return

#Will this program execute? qns option
label exYes:
    show ale standing hand both fold at aleAlign with dissolve
    k "Yes, I think this program is going execute."
    show ale speaking hand both fold with dissolve
    a "That's right, Kevin! Good job."
    return
label exConfused:
    show ale standing hand both fold at aleAlign with dissolve
    k "I am confused, Emma. I don't think this program is going to execute."
    show ale speaking hand both fold with dissolve
    a "I get why it seems confusing at first. Let me break it down for you step by step."
    return

#second qns option
label qnsYes: 
    show ale standing hand left side at aleAlign with dissolve
    k "I'm ready for this challenge!"
    show ale speaking hand left side with dissolve
    a "That's the spirit! Here's your question. Take your time, and remember, you only get one chance to get it right!"
    return
label qnsNo:
    show ale standing hand left side at aleAlign with dissolve
    k "No, I'm not sure I'm ready yet."
    show ale speaking hand left side  with dissolve
    a "That's perfectly fine, Kevin. Remember, this is all about learning, and it's okay to feel unsure sometimes."
    show ale speaking hand together with dissolve
    a "Just do your best. If you get stuck, don't worry—I'll guide you through the solution step by step."
    show ale standing hand one fold with dissolve
    k "Alright Emma, I am ready now."
    show ale speaking one fold with dissolve
    a "Great! Here's the question on your screen."
    return
