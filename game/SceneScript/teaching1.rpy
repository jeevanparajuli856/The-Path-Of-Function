define k = Character("Kevin")
define a = Character("Alejendra")
define aleAlign = Position(xpos = 600, xanchor = 0, ypos=-60, yanchor=1)

label teachingfirst: 
    play sound "teachingclass.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg classroom with Fade(1.0,3.5,0.9) 
    show ale speaking hand left side at aleAlign with dissolve
    a "Let me use presentation to show my slide in this board so that you can easily understand the function."
    show ale speaking hand one fold with dissolve
    a "I will play a slide and explain the slide just sitting beside you in your desk."
    show ale standing hand one fold with dissolve
    k "Alright ale! I am ready to nail this down."
    show ale speaking hand both wrist with dissolve
    a "Lets goo.."
    scene bg classroom with fade
    with Pause(3.0)
    show ale explaining hand left up at aleAlign with fade
    show function with dissolve
    a "Ours today topic is function in python"
    show ale speaking hand left side with dissolve
    a "So, Kevin, Let me ask you one question."
    show ale question hand right down  with dissolve
    a "Do you know about Python's built-in functions?"
    with Pause(1.0)
    menu:
        "Do you know about Python's built-in functions?"
        "Yes":
            call builInYes
        "No": 
            call builtInNo

    show ale speaking hand both wrist with dissolve
    a "Now let me sit down with you and lets get started with a built-in Function in python"

    hide ale with fade
    a "Python has many built-in functinons. A function is like a small program that takes an input, processes it, and return an output" ## Here I have to show ale face along with dialgoue as ale will disappear
    a "Let me show you one example"
    show example int with dissolve
    a "Here you go, int() function."
    a "This function takes any real number as input parameter and returns its integer value, ignoring the decimal part."
    a "Let me show you another example using int() function"
    scene bg classroom with fade
    show example int2 with dissolve
    a "Let me show you drawing some box and arrow diagram how variable 'a' is assigned."
    show example int2 arrowf with dissolve
    a "Here, we have assigned variable 'a' with value return by int(2.6)"
    show example int2 arrows with dissolve
    a "Then, variable 'a' is passed to another function print()."
    a "Let me step outside and ask you one question"
    show example int2 arrows qns with dissolve
    show ale standing hand left side with dissolve
    show ale question hand left up at aleAlign with dissolve
    a "Kevin, do you know what will be the output for this small program?"
    call inputCheck


    #user define function
    show ale explaining hand left up with dissolve
    a "2 is the right answer as we have passed variable 'a' in print() and value of 'a' is 2."
    show ale speaking hand both wrist with dissolve
    a "Let's take a step further. Do you know anything about user-defined functions?"
    show ale standing hand both wrist with dissolve
    k "No, not really. Did the professor even talk about that?"
    show ale question hand left down angr with dissolve
    a "Kevin, where was your mind during the morning class? The professor covered a lot on this topic!"
    show ale standing hand left side with dissolve
    a "Sorry, Ale! I don't know why I can't concerntrate in that class. You're my only hope right now"
    show ale speaking hand left side with dissolve
    a "It's alright. Let's dive into user-defined functions then."
    show ale explaining hand both down front with dissolve
    a "A user-define function is super helpful for removing duplicate code. It also breaks down complex problems into smaller, magaeble pieces."
    show ale explaining hand right up with dissolve
    a "And also, user-defined functions can be reused when similar problems pop up in other parts of your program."
    show ale speaking hand both fold with dissolve
    a "Let me show you a basic syntax of user-defined function"
    scene bg classroom with fade
    show userdefine first with dissolve
    a "So, here is the basic syntax for user defined function."
    show userdefine first def with dissolve
    a "Can you see the word def?"
    a "Thats the keyword we use to define a user-defined function."
    show userdefine first funname with dissolve
    a "After that, we write the function name, followed by parenthesis. Inside those parentheses, we can define parameters."
    show userdefine first param with dissolve
    a "A parameter is a variable that represents a piece of data passed into the function. We call this \"pass by postion\", meaning the order of parameters matters"
    a "When we call the function elsewhere in the code, we pass arguments, which are the actual values. These arguments are matched with the parameters in the same order they were defined."
    show userdefine first insidefun with dissolve
    a "Inside the function, we write the code that defines its behaviour-things like calculations, printing or anything else you want the function to do."
    show userdefine first returns with dissolve
    a "At the end, there's usually a return statement. This sends back a value after the fucntion has finished executing"
    a "Now let me show you an example of user-defined function"

    scene bg classroom with fade
    show fahren with dissolve
    with Pause(1.0)
    a "Let me step outside and ask you a question"
    show ale standing hand left side at aleAlign with dissolve 
    show ale question hand left up at aleAlign with dissolve 
    a "What is the name of the function here?"
    with Pause(1.0)
    menu:
        "What is the name of the function here?"
        "fahrenheit":
            call fahrNo
        "fahrenheitToCelsius": 
            call fahrYes
    
    show ale speaking hand together with dissolve
    a "Lets talk more about the fahrenheitToCelsius function"
    show ale speaking hand left side with dissolve
    a "Let me sit beside you and explain about this function"
    hide ale
    show fahren para with dissolve
    a "As you know now, fahrenheit is a parameter. This mean that when we call this function in other block of code, we need to pass a value for fahrenheit"
    show fahren celbody with dissolve
    a "Inside the body of this function, there is a statement that converts fahrenheit to celsius, and the result is stored in a variable called celsius"
    show fahren celqns with dissolve
    a "Now, here's your next question. What is the value that a variable celsius will hold when the function is called with an argument of 98"
    call valcheck
    show fahren solve with dissolve
    show ale speaking hand one fold at aleAlign with dissolve
    a "As we sent 98 as argument then second statement of function convert the fahrenheit into celsius and value is assigned to variable 'celsius'"
    show ale standing hand both wrist
    show ale speaking hand both wrist with dissolve
    a "round() method is used to limit the decimal value to 2 decimal place"
    show ale standing hand left side with dissolve
    show ale speaking hand left side with dissolve
    a "Now, lets further explore the fahrenheitToCelsius function"
    hide ale 
    show fahren returns with dissolve
    a "After the body of the function, you can see a return statement."
    a "This statement returns the value stored in celsius to wherever the function was called."
    return


label builInYes:
    show ale standing hand both fold with dissolve
    k "Yeah, I Know a little bit about them. That's about the only thing I manged to focus on during class today."
    show ale speaking hand both fold with dissolve
    a " Great! Let's quickly review those topics to make sure they're clear"
    return

label builtInNo:
    show ale standing hand both fold with dissolve
    k "Nope, today's lecture went completely over my head"
    show ale speaking hand both fold with dissolve
    a "That's fine, Kevin. I'll walk you through it step by step"
    return

label fahrYes:
    show ale standing hand both wrist with dissolve
    k "It's fahrenheitToCelsisus."
    show ale speaking hand both wrist with dissolve
    a "That's right! You've got it, my friend."
    show ale speaking hand one fold with dissolve
    a "The function name is fahrenheitToCelsius, and fahrenheit is the parameter."
    return

label fahrNo:
    show ale standing hand both wrist with dissolve
    k "It's fahrenheit"
    show ale sad hand both wrist with dissolve
    a "That's not a right answer kevin!"
    show ale speaking one fold with dissolve
    a "fahrenheit is the parameter, not the function name. You can compare it with the syntax I just showed you"
    show ale speaking hand left side with dissolve
    a "And, the function name is fahrenheitToCelsius"
    return

label inputCheck: 
    python:
        outputIn = renpy.input("What will be the output?",length =32)
        count =2;
        while(count!=0):
            if(outputIn=="2"):
                renpy.transition(dissolve)
                renpy.show("ale speaking hand left side")
                renpy.say(a,"You got it right answer")
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
                renpy.say(a,"You got it right answer")
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