define k = Character("Kevin")
define a = Character("Alejendra")
define aleAlign = Position(xpos = 650, xanchor = 2, ypos=-60, yanchor=1)
label teachingSecond:
    scene bg classroom with dissolve
    show fahren with dissolve
    show ale standing hand both wrist at aleAlign with dissolve
    show ale question hand both down at aleAlign with dissolve
    a "What do you think,Kevin? Will this program execute or not?"
    menu:
        "Will this program execute?"
        "Yes":
            call exYes
        "Confused":
            call exConfused
    scene bg classroom with fade
    show fahren2 explain with dissolve
    a "Ths program will get execute and allow a user to input a number. The value will be stored in a variable"
    show fahren2 input with dissolve
    a "For example, if the user inputs 100, then temp wll hold 100."
    show fahren2 funcall with dissolve
    a "Next, the fahrenheitToCelsius() function is called, passing the value of temp."
    show fahren2 returns with dissolve
    a "The returned value form fahrenheitToCelsius() is stored in another variable called celsius, which in this case will be 37.78."
    show fahren2 print with dissolve
    a "After that, the print statement is executed"
    a "However, let me tell you one important thing."
    show fahren2 last3 with dissolve
    a "It is not good practice to write the main logic of the program -like the last three lines shown on the screen- outside of specifc block"


    a "This is the where the concept of using main() function comes in."
    hide fahren2 
    show mains with dissolve
    a "Inside the main() function, we write the main logic of the program. It is a function that helps organize and direct the flow of program"
    a "Let me show you an example of using a main() function."
    hide mains
    show main examp behind ale with dissolve 
    a "Its syntax is similar to any other user-defined function."
    show main def with dissolve
    a "First we use the def keyword, followed by main()."
    show main bodyst with dissolve
    a "Then, we include the main logic of the program inside it."


    a "Let me go there infront of you and ask you a question."
    show ale standing hand left side at aleAlign with fade
    show ale question hand both down with dissolve 
    a "Do you know how to call the main() function to execute the program?"
    show ale standing hand both wrist with dissolve
    k "Yeah, I guess we have to write main() at end of the code to call the main() function and execute the program."
    show ale speaking hand both wrist with dissolve
    a "You are right,Kevin. Without calling it, the main()function won't execute by itself."
    show ale standing hand one fold with dissolve
    show ale speaking hand one fold with dissolve
    a "So, we've just defined the main() function. Now, we need to call the main() function after writing all the statements inside main()."
    show main cal with dissolve
    show ale explaining hand left up with dissolve
    a "As you can see on the screen, main() is called right after its defination. when the main() function is called, it executes all the statements within its funciton's body."
    show ale speaking hand left side with dissolve
    a "Do you now understand the concept of function defination and function calls?"
    show ale standing hand left side with dissolve
    k "Now it's all starting to make sense to me!"

    show ale speaking hand left side with dissolve
    a "That's great to hear, Kevin. Alright, it's already 6 PM. Let's wrap up for today by solving one last question."
    show ale speaking hand together with dissolve
    a "Tomorrow morning, we’ll dive into an exciting topic: understanding how memory allocation happens in the stack when a program and its functions are executed."
    show ale standing hand both fold with dissolve
    k "Sounds great! Let's meet at 8 AM tomorrow morning."
    show ale speaking hand both fold with dissolve
    a "That's perfect for me"
    show ale speaking hand both wrist with dissolve
    a "Now, I will show you a question on the screen where you need to drag and drop the correct blocks to complete a python program"
    show ale question hand both down with dissolve
    a "Are you ready?"
    menu:
        "Are you ready?"
        "Yes":
            call qnsYes
        "No":
            call qnsNo
    with Fade(0.5,1,0.5)
    call dragqns 
    return
label exYes:
    show ale standing hand both fold at aleAlign with dissolve
    k "Yes, I think this program gonna execute"
    show ale speaking hand both fold with dissolve
    a "You got it right"
    return
label exConfused:
    show ale standing hand both fold at aleAlign with dissolve
    k "I am confused, Ale"
    k "I don't think so this program gonna execute"
    show ale speaking hand both fold with dissolve
    a "Yeah, I understand it looks confusing at first. So, let me explain you"
    return

label qnsYes: 
    show ale standing hand left side at aleAlign with dissolve
    k "I'm ready for this challenge!"
    show ale speaking hand left side with dissolve
    a "Awesome! Here's your question. Take your time and have fun with it. You will have one chances to make it right."
    return
label qnsNo:
    show ale standing hand left side at aleAlign with dissolve
    k "No, I'm not sure I'm ready yet."
    show ale speaking hand left side  with dissolve
    a "That's okay, Kevin. Remeber, this all about learning, and it's perfectly fine to feel uncertain sometimes."
    show ale speaking hand together with dissolve
    a "Just give it your best shot. If you get stuck, don't worry- I'll walk you through the solution step by step."
    show ale standing hand one fold with dissolve
    k "Alright ale, I am ready then now."
    show ale speaking one fold with dissolve
    a "Great!Here's the question on your screen"
    return
