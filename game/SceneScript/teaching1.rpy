define k = Character("Kevin")
define a = Character("Emma")
define aleAlign = Position(xpos = 600, xanchor = 0, ypos=-60, yanchor=1)

label teachingfirst: 
    play sound "teachingclass.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg classroom with Fade(1.0,3.5,0.9) 
    show ale speaking hand left side at aleAlign with dissolve
    a "Let me pull up a presentation on the board—it’ll make understanding functions a lot easier."
    show ale speaking hand one fold with dissolve
    a "I’ll explain each slide while sitting beside you at your desk, so feel free to stop me if you have questions."
    show ale standing hand one fold with dissolve
    k "Alright, Ale! I’m ready to tackle this."
    show ale speaking hand both wrist with dissolve
    a "Let’s do this!"
    scene bg classroom with fade
    with Pause(3.0)
    show ale explaining hand left up at aleAlign with fade
    show function with dissolve
    a "Today’s topic is functions in Python."
    show ale speaking hand left side with dissolve
    a "But before we dive in, Kevin, let me ask you something."
    show ale question hand right down  with dissolve
    a "Do you know anything about Python’s built-in functions?"
    with Pause(1.0)
    menu:
        "Do you know about Python's built-in functions?"
        "Yes":
            call builInYes
        "No": 
            call builtInNo

    show ale speaking hand both wrist with dissolve
    a "Now let me sit down with you, and we’ll get started with Python’s built-in functions."

    hide ale with fade
    a "Python has many built-in functions. Think of a function as a mini-program—it takes an input, processes it, and gives you an output."
    a "Let me show you an example."
    show example int with dissolve
    a "Here you go, the `int()` function."
    a "This function takes any real number as input parameter and returns its integer value, ignoring the decimal part."
    a "Now let me give you another example using the int() function."
    scene bg classroom with fade
    show example int2 with dissolve
    a "Here, let’s use a diagram to visualize how the variable 'a' is assigned."
    show example int2 arrowf with dissolve
    a "We’ve assigned the variable 'a' the value returned by int(2.6)."
    show example int2 arrows with dissolve
    a "Next, the variable 'a' is passed as an argument to another function, print()."
    a "Let me step aside for a moment and ask you a question."
    show example int2 arrows qns with dissolve
    show ale standing hand left side with dissolve
    show ale question hand left up at aleAlign with dissolve
    a "Kevin, can you tell me what the output of this small program will be?"
    call inputCheck


    #user define function
    show ale explaining hand left up with dissolve
    a "The answer is 2 because we passed the variable 'a' to print(), and its value is 2."
    show ale speaking hand both wrist with dissolve
    a "Let’s step it up a notch. Do you know anything about user-defined functions?"
    show ale standing hand both wrist with dissolve
    k "Uh... not really. Did the professor even mention that?"
    show ale question hand left down angr with dissolve
    a "Kevin, where was your head during class? The professor spent ages explaining this!"
    show ale standing hand left side with dissolve
    a "Sorry, Ale! I don’t know why I can’t focus in that class. You’re literally my only hope right now."
    show ale speaking hand left side with dissolve
    a "Alright, alright. Let’s not waste time—let’s talk about user-defined functions!"
    show ale explaining hand both down front with dissolve
    a "User-defined functions are lifesavers! They help you avoid repeating the same code and break down big problems into smaller, manageable chunks."
    show ale explaining hand right up with dissolve
    a "And the best part? You can reuse them whenever similar problems show up elsewhere in your program. Think of it as building your personal toolkit."
    show ale speaking hand both fold with dissolve
    a "Let me show you the basic syntax of a user-defined function."
    scene bg classroom with fade
    show userdefine first with dissolve
    a "Here’s what the basic syntax looks like."
    show userdefine first def with dissolve
    a "Notice the word `def`? That’s the magic keyword for defining a function."
    show userdefine first funname with dissolve
    a "Next, you give your function a name. Make it descriptive, so you know what it does—no `function123` nonsense!"
    show userdefine first param with dissolve
    a "After the name, you add parentheses. Inside these, you can define parameters. Think of them as placeholders for the data your function will work with."
    a "Parameters work on a 'pass by position' system, meaning the order of the parameters is super important."
    a "When you call the function in your code, you pass *arguments*, which are the actual values. These get matched with the parameters in the same order."
    show userdefine first insidefun with dissolve
    a "Now, inside the function, you write the code that does the actual work. It could be calculations, printing, or whatever task you need."
    show userdefine first returns with dissolve
    a "Finally, there’s the return statement. It’s like sending a package back—it gives you the function’s result after all the work is done."
    a "Got it so far? Great! Now, let me show you an example of a user-defined function."

    scene bg classroom with fade
    show fahren with dissolve
    with Pause(1.0)
    a "Let me step outside for a moment and test your understanding."
    show ale standing hand left side at aleAlign with dissolve 
    show ale question hand left up at aleAlign with dissolve 
    a "Take a look at this example. Can you tell me the name of the function?"
    with Pause(1.0)
    menu:
        "What is the name of the function here?"
        "fahrenheit":
            call fahrNo
        "fahrenheitToCelsius": 
            call fahrYes
    
    show ale speaking hand together with dissolve
    a "Let’s dive deeper into the `fahrenheitToCelsius` function."
    show ale speaking hand left side with dissolve
    a "I’ll sit beside you to explain this in detail."
    hide ale
    show fahren para with dissolve
    a "As you know, fahrenheit is the parameter. This means that when we call the function elsewhere in the code, we need to pass a value for fahrenheit."
    show fahren celbody with dissolve
    a "Inside the function body, there’s a statement that converts the value of fahrenheit to Celsius. The result is stored in a variable called celsius."
    show fahren celqns with dissolve
    a "Here’s your next challenge: What value will the variable \"celsius\" hold if the function is called with an argument of 98?"
    call valcheck
    show fahren solve with dissolve
    show ale speaking hand one fold at aleAlign with dissolve
    a "When we pass 98 as the argument, the second statement in the function converts the Fahrenheit value into Celsius and assigns it to the variable \"celsius\"."
    show ale standing hand both wrist
    show ale speaking hand both wrist with dissolve
    a "The `round()` method is used to limit the decimal value of `celsius` to two decimal places."
    show ale standing hand left side with dissolve
    show ale speaking hand left side with dissolve
    a "Now let’s take a closer look at the return statement in the `fahrenheitToCelsius` function."
    hide ale 
    show fahren returns with dissolve
    a "At the end of the function, there’s a return statement. This statement sends the value of `celsius` back to wherever the function was called."
    a "This way, the converted Celsius value can be used elsewhere in the program. Neat, right?"
    return


label builInYes:
    show ale standing hand both fold with dissolve
    k "Yeah, I know a little about them. Honestly, it’s one of the few things I managed to focus on in class today."
    show ale speaking hand both fold with dissolve
    a "Great! Let’s quickly review those topics to make sure everything’s crystal clear."
    return

label builtInNo:
    show ale standing hand both fold with dissolve
    k "Nope, today’s lecture went completely over my head."
    show ale speaking hand both fold with dissolve
    a "That’s okay, Kevin. Don’t worry—I’ll walk you through it step by step."
    return

label fahrYes:
    show ale standing hand both wrist with dissolve
    k "It's fahrenheitToCelsisus."
    show ale speaking hand both wrist with dissolve
    a "That's right! You've got it, my friend."
    show ale speaking hand one fold with dissolve
    a "The function name is fahrenheitToCelsius, and fahrenheit is its parameter. Great job catching that!"
    return

label fahrNo:
    show ale standing hand both wrist with dissolve
    k "It's fahrenheit"
    show ale sad hand both wrist with dissolve
    a "Not quite, Kevin. That’s the parameter, not the function name."
    show ale speaking one fold with dissolve
    a "Think back to the syntax I just explained. The parameter goes inside the parentheses, and the function name comes before it."
    show ale speaking hand left side with dissolve
    a "The correct function name is fahrenheitToCelsius. Don’t worry, you’ll get it next time!"
    return

label inputCheck: 
    python:
        outputIn = renpy.input("What will be the output?",length =32)
        count =2;
        while(count!=0):
            if(outputIn=="2"):
                renpy.transition(dissolve)
                renpy.show("ale speaking hand left side")
                renpy.say(a,"You got it right!")
                count=0
            else:
                renpy.transition(moveinleft)
                renpy.call_screen("notiGuide",count)
                renpy.transition(dissolve)
                outputIn = renpy.input("What will be the output?",length =32)
                count-=1
                if(count==0):
                    renpy.transition(dissolve)
                    renpy.show("ale sad hand left side")
                    renpy.say(a,"Kevin, you gave a wrong answer.")
    return


label valcheck: 
    python:
        outputIn = renpy.input("What will be the value hold by celsius?",length =32)
        count =2;
        while(count!=0):
            if(outputIn=="36.67"):
                renpy.transition(dissolve)
                
                renpy.show("ale speaking hand both fold", at_list = [aleAlign])
                renpy.say(a,"You got it. Right answer!")
                count=0
            else:
                renpy.transition(moveinleft)
                renpy.call_screen("notiGuide",count)
                renpy.transition(dissolve)
                outputIn = renpy.input("What will be the value hold by celsius?",length =32)
                count-=1
                if(count==0):
                    renpy.transition(dissolve)
                    renpy.show("ale sad hand both fold",at_list = [aleAlign])
                    renpy.say(a,"Kevin, It's not a right answer.")
                
return