define k = Character("Kevin")
define e = Character("Emma")
define aleAlign = Position(xpos = 600, xanchor = 0, ypos=-60, yanchor=1)

label teachingfirst: 
    python:
        emit_scene_start(TELEMETRY_SCENE_IDS["teachingfirst"])
        emit_learning_context_update(
            TELEMETRY_TOPIC_IDS["builtin"],
            "Understand what Python built-in functions do and how to use them.",
            "beginner",
            ["function", "built-in", "input", "output"],
        )

    play sound "teachingclass.mp3" fadein 1.0 fadeout 2.0 loop #changing the sound
    scene bg classroom with Fade(1.0,3.5,0.9) 
    show ale speaking hand left side at aleAlign with dissolve
    e "Let me pull up my Function presentation on the projector, it'll make understanding functions a lot easier."
    show ale speaking hand one fold with dissolve
    e "I'll explain each slide and feel free to stop me if you have questions."
    show ale standing hand one fold with dissolve
    k "Alright, Emma! I'm ready to tackle this."
    show ale speaking hand both wrist with dissolve
    e "Let's do this!"
    #starting of the slide
    scene bg classroom with fade
    with Pause(3.0)
    show function with fade
    show ale explaining hand left up at aleAlign with dissolve
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_topic_intro"], "e", "Today's topic is functions in Python.")
    e "Today's topic is functions in Python."
    show ale speaking hand left side with dissolve
    e "But before we dive in, Kevin, let me ask you question."
    show ale question hand right down  with dissolve
    e "Do you remember anything about Python's built-in functions?"
    with Pause(1.0)
    menu: #to give option to the player
        "Do you remember anything about Python's built-in functions?" 
        "Yes":
            python:
                emit_choice_made("teaching1_builtin_yes", "Yes")
            call builInYes
        "No": 
            python:
                emit_choice_made("teaching1_builtin_no", "No")
            call builtInNo

    #Starting of the python function explanation
    show ale speaking hand both wrist with dissolve
    python:
        emit_player_state_update({"phase": "teaching1_builtin_intro"})
    e "Now let me sit down with you, and we'll get started with Python's built-in functions."
    hide ale with fade
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_builtin_explain"], "e", "Python has many built-in functions.")
    e "Python has many built-in functions. Think of a function as a mini-program, it takes an input, processes it, and gives you an output."
    e "Let me show you an example."
    show example int with dissolve
    e "Here you go, the 'int()' function."
    e "This function takes a number as input and returns an integer by removing the decimal part."
    e "Now let me give you another example using the int() function."
    scene bg classroom with fade
    show example int2 with dissolve
    e "Here, let's use a diagram to visualize how the variable 'a' is assigned value."
    show example int2 arrowf with dissolve
    e "In this case, we're assigning 'a' the value returned by int(2.6)."
    show example int2 arrows with dissolve
    e "Next, the variable 'a' is passed as an argument to another function, print()."

    #Input box question
    e "Let me ask you a question."
    show example int2 arrows qns with dissolve
    show ale standing hand left side at aleAlign with dissolve
    show ale question hand left up at aleAlign with dissolve
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_input_prompt"], "e", "Kevin, can you tell me what the output of this small program will be?")
    e "Kevin, can you tell me what the output of this small program will be?"
    call inputCheck #calling python scrip to determine the input is correct or not

    #Explaining the answer
    show ale explaining hand left up with dissolve
    e "The answer is 2 because we passed the variable 'a' to print() as argument, and its value is 2."
    show ale speaking hand both wrist with dissolve

    #User define function explanation
    python:
        emit_learning_context_update(
            TELEMETRY_TOPIC_IDS["user_defined"],
            "Understand user-defined function structure and purpose.",
            "beginner",
            ["function", "user-defined", "def", "reuse"],
        )

    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_userdef_intro"], "e", "Let's step it up a notch. Do you know anything about user-defined functions?")
    e "Let's step it up a notch. Do you know anything about user-defined functions?"
    show ale standing hand both wrist with dissolve
    k "Uh... not really. Did the professor even mention that?"
    show ale question hand left down angr with dissolve
    e "Kevin, where was your head during class? The professor explained this for so long!"
    show ale standing hand left side with dissolve
    a "Sorry, Emma! I don't know why I can't focus in that class. You're literally my only hope right now."
    show ale speaking hand left side with dissolve
    e "Alright, alright! Let's not waste time. Let's talk about user-defined functions!"
    show ale explaining hand both down front with dissolve
    e "User-defined functions are lifesavers! They help you avoid repeating the same code and break down big problems into smaller, manageable chunks."
    show ale explaining hand right up with dissolve
    e "And the best part? You can reuse them whenever similar problems show up elsewhere in your program. Think of it as building your personal toolkit."
    show ale speaking hand both fold with dissolve
    e "Let me show you the basic syntax of a user-defined function."

    #Scene change to project the user define function example in screen
    scene bg classroom with fade
    show userdefine first with dissolve
    e "Here's what the basic syntax looks like."
    show userdefine first def with dissolve
    e "Notice the word 'def'? That's the magic keyword for defining a function."
    show userdefine first funname with dissolve
    e "Next, you give your function a name. Make it descriptive, so you know what it does but, none of that 'function123' nonsense!"
    show userdefine first param with dissolve
    python:
        emit_learning_context_update(
            TELEMETRY_TOPIC_IDS["parameters"],
            "Understand formal parameters and argument passing by position.",
            "beginner",
            ["formal-parameter", "argument", "position", "function-call"],
        )

    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_param_intro"], "e", "After the name, you add parentheses and formal parameters.")
    e "After the name, you add parentheses. Inside these, you can define zero or more formal parameters. Think of formal parameter as placeholders for the data your function will work with."
    e "Parameters work on a 'pass by position' system, meaning the order of the parameters is super important."
    e "When you call a function in your program, you must pass as many actual values as there are formal parameters. These actual values are matched with the formal parameters in the same order."
    show userdefine first insidefun with dissolve
    e "Now, inside the function, you write the code that does the actual work. It could be calculations, printing, or whatever task you need."
    show userdefine first returns with dissolve
    python:
        emit_learning_context_update(
            TELEMETRY_TOPIC_IDS["returns"],
            "Understand how return statements send values back to the caller.",
            "beginner",
            ["return", "output", "caller"],
        )

    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_return_intro"], "e", "Finally, there's the return statement.")
    e "Finally, there's the return statement. The return statement sends the defined value back to the calling program."
    e "Got it so far? Great! Now, let me show you an example of a user-defined function."

    #ale come ahead and show the example
    scene bg classroom with fade
    show fahren with dissolve
    with Pause(1.0)
    e "Let me step outside for a moment and test your understanding."
    show ale standing hand left side at aleAlign with dissolve 
    show ale question hand left up at aleAlign with dissolve 
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_name_prompt"], "e", "Take a look at this example. Can you tell me the name of the function?")
    e "Take a look at this example. Can you tell me the name of the function?"
    with Pause(1.0)
    menu: #giving the option and calling the label
        "What is the name of the function here?"
        "fahrenheit":
            python:
                emit_choice_made("teaching1_function_name_fahrenheit", "fahrenheit")
            call fahrNo
        "fahrenheitToCelsius": 
            python:
                emit_choice_made("teaching1_function_name_correct", "fahrenheitToCelsius")
            call fahrYes
    
    show ale speaking hand together with dissolve
    e "Le's dive deeper into the 'fahrenheitToCelsius' function."
    show ale speaking hand left side with dissolve
    e "I'll sit beside you to explain this in detail."
    hide ale
    show fahren para with dissolve
    e "As you know, fahrenheit is the formal parameter. This means that when we call the function in the program, we need to pass a actual value for fahrenheit parameter."
    show fahren celbody with dissolve
    e "Inside the function body, there's a statement that converts the value held by formal parameter-fahrenheit to celsius value. The celsius value is stored in a variable called celsius."
    show fahren celqns with dissolve
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching1_celsius_prompt"], "e", "What value will fahrenheitToCelsius return when 98 is passed?")
    e "Here's your next challenge: What value will the function fahrenheitToCelsius return to calling program when an value of 98 is passed to function"
    call valcheck #calling the python script to check the answer
    python:
        emit_player_state_update({"phase": "teaching1_value_check_complete"})

    #explanation of example
    show fahren solve with dissolve
    show ale speaking hand one fold at aleAlign with dissolve
    e "When we pass 98 as the argument, the second statement in the function converts the Fahrenheit value into Celsius and assigns it to the variable \"celsius\"."
    show ale standing hand both wrist
    show ale speaking hand both wrist with dissolve
    e "The 'round()' method is used to limit the decimal value of the variable 'celsius' to two decimal places."
    show ale standing hand left side with dissolve
    show ale speaking hand left side with dissolve
    e "Now let's take a closer look at the return statement in the 'fahrenheitToCelsius' function."
    hide ale  #hiding the front image of ale
    show fahren returns with dissolve
    e "At the end of the function, there's a return statement. This statement sends the value of 'celsius' back to calling program"
    e "This way, the converted Celsius value can be used elsewhere in the program. Neat, right?"
    python:
        emit_player_state_update({"phase": "teaching1_complete"})

    return


label builInYes: #option for the builtInquestion
    show ale standing hand both fold with dissolve
    k "Yeah, I remember a little about them. Honestly, it's one of the few things I managed to focus on in class today."
    show ale speaking hand both fold with dissolve
    e "Great! Let's quickly review those topics to make sure everything's crystal clear."
    python:
        emit_player_state_update({"checkpoint": "teaching1_builtin_yes"})

    return
label builtInNo: #Second option for the builtInquestion
    show ale standing hand both fold with dissolve
    k "Nope, today's lecture went completely over my head."
    show ale speaking hand both fold with dissolve
    e "That's okay, Kevin. Don't worry, I'll walk you through it step by step."
    python:
        emit_player_state_update({"checkpoint": "teaching1_builtin_no"})

    return

#second qns option
label fahrYes: #option for second qns
    show ale standing hand both wrist with dissolve
    k "It's fahrenheitToCelsisus."
    show ale speaking hand both wrist with dissolve
    e "That's right! You've got it, my friend."
    show ale speaking hand one fold with dissolve
    e "The function name is fahrenheitToCelsius, and fahrenheit is its formal parameter. Great job catching that!"
    python:
        emit_player_state_update({"checkpoint": "teaching1_function_name_correct"})

    return
label fahrNo:
    show ale standing hand both wrist with dissolve
    k "It's fahrenheit"
    show ale sad hand both wrist with dissolve
    e "Not quite, Kevin. That's the formal parameter, not the function name."
    show ale speaking one fold with dissolve
    e "Think back to the syntax I just explained. The formal parameter goes inside the parentheses, and the function name comes before it."
    show ale speaking hand left side with dissolve
    e "The correct function name is fahrenheitToCelsius. Don't worry, you'll get it next time!"
    python:
        emit_player_state_update({"checkpoint": "teaching1_function_name_wrong"})

    return

#checking the fist input qns
# label inputCheck: #old version of input check we used that we used default input box.
#     python:
#         outputIn = renpy.input("What will be the output?",length =32)
#         count =2;
#         while(count!=0):
#             if(outputIn=="2"):
#                 renpy.transition(dissolve) #using the renpy script in python block
#                 renpy.show("ale speaking hand left side")
#                 renpy.say(e,"You got it right!")
#                 count=0
#             else:
#                 renpy.transition(moveinleft)
#                 renpy.call_screen("notiGuide",count) #important to call the screen. It is calling the another frame that is pop when user enter wrong answer and show how many chance is left
#                 renpy.transition(dissolve)
#                 outputIn = renpy.input("What will be the output?",length =32)
#                 count-=1
#                 if(count==0):
#                     renpy.transition(dissolve)
#                     renpy.show("ale sad hand left side")
#                     renpy.say(e,"Kevin, you gave a wrong answer.")
#     return

label inputCheck:
    default answer = ""
    $ count = 3
    $ max_attempts = 3
    python:
        emit_quiz_started(
            quiz_id=TELEMETRY_QUIZ_IDS["input_output"],
            question_id=TELEMETRY_QUESTION_IDS["input_output_1"],
            extra={"question_text": "What will be the output?", "max_attempts": max_attempts}
        )
    
    while count != 0:

        call screen custom_input("What will be the output?", "answer")
        $ outputIn = answer

        if outputIn == "2":
            $ attempt_number = max_attempts - count + 1
            python:
                emit_quiz_submitted(
                    quiz_id=TELEMETRY_QUIZ_IDS["input_output"],
                    question_id=TELEMETRY_QUESTION_IDS["input_output_1"],
                    is_correct=True,
                    extra={"attempt_number": attempt_number, "student_answer": outputIn}
                )
            with dissolve
            show ale speaking hand left side at aleAlign
            e "You got it right!"
            $ count = 0

        else:

            $ count -= 1
            $ telemetry_add_wrong_attempt(1)
            if count == 0:
                python:
                    emit_quiz_submitted(
                        quiz_id=TELEMETRY_QUIZ_IDS["input_output"],
                        question_id=TELEMETRY_QUESTION_IDS["input_output_1"],
                        is_correct=False,
                        extra={"attempt_number": max_attempts, "student_answer": outputIn, "max_attempts": max_attempts}
                    )
                with dissolve
                show ale sad hand left side at aleAlign
                e "Kevin, you gave a wrong answer."
                with moveinleft
            else: 
                call screen notiGuide(count)
                with dissolve

    return



#checking the second input qns
# label valcheck: 
#     python:
#         outputIn = renpy.input("What will be the value hold by celsius?",length =32)
#         count =2;
#         while(count!=0):
#             if(outputIn=="36.67" or outputIn=="36.7" or outputIn=="37"):
#                 renpy.transition(dissolve)
                
#                 renpy.show("ale speaking hand both fold", at_list = [aleAlign])
#                 renpy.say(e,"You got it. Right answer!")
#                 count=0
#             else:
#                 renpy.transition(moveinleft)
#                 renpy.call_screen("notiGuide",count)
#                 renpy.transition(dissolve)
#                 outputIn = renpy.input("What will be the value hold by celsius?",length =32)
#                 count-=1
#                 if(count==0):
#                     renpy.transition(dissolve)
#                     renpy.show("ale sad hand both fold",at_list = [aleAlign])
#                     renpy.say(e,"Kevin, It's not a right answer.")
                
# return

label valcheck:
    default answer2 = ""
    $ count = 3
    $ max_attempts = 3
    python:
        emit_quiz_started(
            quiz_id=TELEMETRY_QUIZ_IDS["celsius_value"],
            question_id=TELEMETRY_QUESTION_IDS["celsius_value_1"],
            extra={"question_text": "What value will celsius hold?", "max_attempts": max_attempts}
        )
    
    while count != 0:

        call screen custom_input("What will be the value hold by celsius?", "answer2")
        $ outputIn = answer2

        if (outputIn=="36.67" or outputIn=="36.7" or outputIn=="37" or outputIn == "36.66"):
            $ attempt_number = max_attempts - count + 1
            python:
                emit_quiz_submitted(
                    quiz_id=TELEMETRY_QUIZ_IDS["celsius_value"],
                    question_id=TELEMETRY_QUESTION_IDS["celsius_value_1"],
                    is_correct=True,
                    extra={"attempt_number": attempt_number, "student_answer": outputIn}
                )
            with dissolve
            show ale speaking hand both fold at aleAlign
            e "You got it. Right answer!"
            $ count = 0

        else:

            $ count -= 1
            $ telemetry_add_wrong_attempt(1)
            if count == 0:
                python:
                    emit_quiz_submitted(
                        quiz_id=TELEMETRY_QUIZ_IDS["celsius_value"],
                        question_id=TELEMETRY_QUESTION_IDS["celsius_value_1"],
                        is_correct=False,
                        extra={"attempt_number": max_attempts, "student_answer": outputIn, "max_attempts": max_attempts}
                    )
                with dissolve
                show ale sad hand both fold at aleAlign
                e "Kevin, It's not a right answer." 
                with moveinleft
            else: 
                call screen notiGuide(count)
                with dissolve
    return
