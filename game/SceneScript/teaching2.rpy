define k = Character("Kevin")
define a = Character("Alejendra")
define aleAlign = Position(xpos = 650, xanchor = 2, ypos=-60, yanchor=1)
label teachingSecond:
    scene bg classroom with dissolve
    show fahren with dissolve
    show ale standing at aleAlign with dissolve
    show ale speaking at aleAlign with dissolve
    a "What do you think,Kevin? Will this program execute or not?"
    menu:
        "Will this program execute?"
        "Yes":
            call exYes
        "Confused":
            call exConfused
    hide ale 
    hide fahren
    show fahren2 explain with dissolve
    show ale speaking at aleAlign 
    a "Ths program will get execute and allow a user to input a number. The value will be stored in a variable"
    show fahren2 input with dissolve
    show ale speaking second with dissolve
    a "For example, if the user inputs 100, then temp wll hold 100."
    show fahren2 funcall with dissolve
    show ale speaking with dissolve
    a "Next, the fahrenheitToCelsius() function is called, passing the value of temp."
    show fahren2 returns with dissolve
    show ale speaking second with dissolve
    a "The returned value form fahrenheitToCelsius() is stored in another variable called celsius, which in this case will be 37.78."
    show fahren2 print with dissolve
    show ale speaking with dissolve
    a "After that, the print statement is executed"
    show ale speaking second with dissolve
    a "However, let me tell you one important thing."
    show fahren2 last3 with dissolve
    show ale speaking with dissolve
    a "It is not good practice to write the main logic of the program -like the last three lines shown on the screen- outside of specifc block"
    show ale speaking second with dissolve
    a "This is the where the concept of using main() function comes in."
    hide fahren2 
    show main with dissolve
    show ale speaking at aleAlign with dissolve
    a "Inside the main() function, we write the main logic of the program. It is a function that helps organize and direct the flow of program"
    show ale speaking second with dissolve
    a "Let me show you an example of using a main() function."
    
    scene bg classroom with fade
    show main examp with dissolve
    


    return
label exYes:
    show ale standing at aleAlign with dissolve
    k "Yes, I think this program gonna execute"
    show ale listening ask happy with dissolve
    a "You got it right"
    return
label exConfused:
    show ale standing at aleAlign with dissolve
    k "I am confused, Ale"
    k "I don't think so this program gonna execute"
    show ale speaking with dissolve
    a "Yeah, I understand it looks confusing at first."
    return
