define aleAlign = Position(xpos = 650, xanchor = 2, ypos=-60, yanchor=1)
label teachingSecond:
    $ emit_scene_start(TELEMETRY_SCENE_IDS["teachingsecond"])
    $ emit_player_state_update({"phase": "teaching2_started"})

    #Now second part of teaching
    scene bg classroom with dissolve
    show fahren with dissolve
    show ale standing hand both wrist at aleAlign with dissolve
    show ale question hand both down at aleAlign with dissolve
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching2_program_exec_intro"], "e", "Will this program execute or not?")
    e "What do you think, Kevin? Will this program execute or not?" #Askign the qns
    menu: #Choice for the qns
        "Will this program execute?"
        "Yes":
            $ emit_choice_made("teaching2_execute_yes", "Yes")
            call exYes
        "Confused":
            $ emit_choice_made("teaching2_execute_confused", "Confused")
            call exConfused

    #Explaining how the funciton gonna execute
    scene bg classroom with fade
    show fahren2 explain with dissolve
    e "Ths program will get executed and allow a user to input a number, which will be stored in the variable **temp**."
    show fahren2 input with dissolve
    e "For example, if the user inputs 100, the variable 'temp' will hold the value 100."
    show fahren2 funcall with dissolve
    e "Next, the fahrenheitToCelsius() function is called, passing the value of 'temp' as the argument."
    show fahren2 returns with dissolve
    e "The value return by fahrenheitToCelsius() function is stored in another variable called **celsius**, which in this case will be 37.78."
    show fahren2 print with dissolve
    e "After that, the print() statement execute to display the result. Inside print(), str() converts the Celsius value into a string, and chr(176) converts the ASCII code 176 into the degree symbol (°)."
    e "However, let me point out something important."
    show fahren2 last3 with dissolve
    e "It's not a good practice to write the main logic of a program, like the last three lines in this example, outside a specific block."
    e "Instead, it's better to encapsulate the main logic within a `main()` function"

    #Starting main() function concept
    $ emit_learning_context_update(
        topic_id=TELEMETRY_TOPIC_IDS["main"],
        objective="Understand main() function organization pattern",
        difficulty="medium",
        tags=["main", "function_organization", "program_structure"]
    )
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching2_main_intro"], "e", "This is where main() function concept comes in.")
    e "This is the where the concept of using main() function comes in."
    hide fahren2 
    show mains with dissolve
    e "Inside the main() function, we write the main logic of the program. It helps organize and direct the flow of the program effectively."
    e "Let me show you an example of using a 'main()' function."
    hide mains
    show main examp behind ale with dissolve 
    e "The syntax is similar to any other user-defined function."
    show main def with dissolve
    e "We start with the def keyword, followed by main()."
    show main bodyst with dissolve
    e "Then, we include the main logic of the program inside the function."

    #Second block of explanation
    e "Let me ask you a question."
    show ale standing hand left side at aleAlign with fade
    show ale question hand both down with dissolve 
    e "Do you know how to call the main() function to execute the program?"
    show ale standing hand both wrist with dissolve
    k "Yeah, I think we need to write main() at the end of the code to call the function and execute it."
    show ale speaking hand both wrist with dissolve
    e "Exactly, Kevin! Without calling it, the main() function won't execute on its own."
    show ale standing hand one fold with dissolve
    show ale speaking hand one fold with dissolve
    e "After defining the main() function, we need to call it, usually at the end, after all the statements have been written."
    show main cal with dissolve
    show ale explaining hand left up with dissolve
    e "As you can see on the screen, 'main()' is called right after its definition. When it's called, it executes all the statements within its body."
    show ale speaking hand left side with dissolve
    e "Does this help you understand the concept of function definitions and function calls?"
    show ale standing hand left side with dissolve
    k "Yeah, it's all starting to make sense now!"
    $ emit_player_state_update({"phase": "main_concept_learned"})

    #Last qns section
    show ale speaking hand left side with dissolve
    e "That's great to hear, Kevin! Before we move on to the next chapter, let's do a quick challenge."
    show ale speaking hand both wrist with dissolve
    e "I'll show you a question on the screen where you'll need to drag and drop the correct blocks to complete a Python program."
    $ emit_help_policy_update(
        help_level="hint",
        spoiler_guard="medium"
    )
    show ale question hand both down with dissolve
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["teaching2_ready_prompt"], "e", "Are you ready?")
    e "Are you ready?"
    menu:
        "Are you ready?"
        "Yes":
            $ emit_choice_made("teaching2_ready_yes", "Yes")
            call qnsYes
        "No":
            $ emit_choice_made("teaching2_ready_no", "No")
            call qnsNo

    $ emit_player_state_update({"phase": "quiz_ready"})
    with Fade(0.5,1,0.5)
    $ emit_quiz_started(
        quiz_id=TELEMETRY_QUIZ_IDS["dragdrop_main"],
        question_id=TELEMETRY_QUESTION_IDS["dragdrop_main_1"]
    )
    call dragqns ## drang and drop qns call
    return  # first round edit completed till here

#Will this program execute? qns option
label exYes:
    show ale standing hand both fold at aleAlign with dissolve
    k "Yes, I think this program is going execute."
    show ale speaking hand both fold with dissolve
    e "That's right, Kevin! Good job."
    return
label exConfused:
    show ale standing hand both fold at aleAlign with dissolve
    k "I am confused, Emma. I don't think this program is going to execute."
    show ale speaking hand both fold with dissolve
    e "I get why it seems confusing at first. Let me break it down for you step by step."
    return

#second qns option
label qnsYes: 
    show ale standing hand left side at aleAlign with dissolve
    k "I'm ready for this challenge!"
    show ale speaking hand left side with dissolve
    e "That's the spirit! Here's your question. Take your time, and remember, you only get one chance to get it right!"
    return
label qnsNo:
    show ale standing hand left side at aleAlign with dissolve
    k "No, I'm not sure I'm ready yet."
    show ale speaking hand left side  with dissolve
    e "That's perfectly fine, Kevin. Remember, this is all about learning, and it's okay to feel unsure sometimes."
    show ale speaking hand together with dissolve
    e "Just do your best. If you get stuck, don't worry—I'll guide you through the solution step by step."
    show ale standing hand one fold with dissolve
    k "Alright Emma, I am ready now."
    show ale speaking one fold with dissolve
    e "Great! Here's the question on your screen."
    return
