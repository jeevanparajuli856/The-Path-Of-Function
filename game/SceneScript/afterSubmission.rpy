define finalAlign = Transform(zoom=0.9, xpos=0.5, xanchor=0.5, ypos=0.9, yanchor=0.6)
label qnsSolved:
    $ emit_scene_start(TELEMETRY_SCENE_IDS["aftersubmission"])
    $ emit_player_state_update({"phase": "aftersubmission_started", "entry_path": "solved"})
    $ emit_player_state_update({"phase": "quiz_solved", "result": "correct"})
    scene bg classroom with fade
    show ale standing hand both wrist at aleAlign with dissolve
    show ale speaking hand both wrist at aleAlign with dissolve
    e "That's awesome, Kevin! You did it!"
    show ale speaking hand together with dissolve
    e "You got all the answers right. I'm so proud of you!"
    show ale standing hand both fold with dissolve
    k "Thank you, Emma! I couldn't have done it without you."
    k "Really, all the credit goes to you."
    show ale blush fold with dissolve
    e "Oh, stop it! You're the one who put in all the effort."
    show ale speaking hand left side with dissolve
    e "But hey, would you like me to go over the answer to this question just to make sure everything's clear?"
    $ emit_player_prompt_started("after_solved_explain_choice", "menu")
    menu:
        "Do you want Emma to explain you the answer to the question?"
        "Yes":
            $ emit_player_prompt_resolved("after_solved_explain_choice", "selected_yes")
            $ emit_choice_made("after_solved_explain_yes", "Yes")
            call yesExplain
        "No":
            $ emit_player_prompt_resolved("after_solved_explain_choice", "selected_no")
            $ emit_choice_made("after_solved_explain_no", "No")
            call noExplain
    return
     

label qnsUnsolve:
    $ emit_scene_start(TELEMETRY_SCENE_IDS["aftersubmission"])
    $ emit_player_state_update({"phase": "aftersubmission_started", "entry_path": "unsolved"})
    $ emit_player_state_update({"phase": "quiz_failed", "result": "incorrect"})
    scene bg classroom with fade
    show ale standing hand both wrist at aleAlign with dissolve
    show ale sad hand both wrist at aleAlign with dissolve
    e "Oops, that's not quite right, Kevin! Looks like you got a bit stuck in the middle."
    show ale speaking hand together with dissolve
    e "No worries, let me help you figure this out step by step."
    show ale standing hand both fold with dissolve
    k "Yeah, Emma, I got a bit confused halfway through. Thanks for stepping in!"
    call puzzleExplaination
    return
    

label yesExplain:
    show ale standing hand both fold at aleAlign with dissolve
    k "Yeah, for sure. That'll make everything clearer."
    call puzzleExplaination
    return
     
label noExplain:
    show ale standing hand both fold at aleAlign with dissolve
    k "I feel pretty confident now."
    k "I don't want to take up more of your time."
    show ale speaking hand both fold at aleAlign with dissolve
    e "Alright, Kevin. You did great today."
    call afterDragNDrop
    return
    
    

label puzzleExplaination:
    show ale speaking hand both fold with dissolve
    e "Let me sit beside you and explain the solution to that question."
    scene bg classroom with fade

    show solution first with dissolve
    e "Let's start with the first box. It's for the function declaration, which calculates the area of a rectangle."
    e "We can confirm this from the print() statement inside the main() block."
    show solution first option with dissolve
    e "There are two options for the function definition, but we'll pick the first box: def calculate_area(length, width)."
    e "The second option only uses width, but to calculate the area, we need both length and width."
    show solution second with dissolve
    e "Next is the second box. This box contains the core logic of the function: multiplying length and width and storing the result in the variable area."
    show solution second option with dissolve
    e "Since the function clearly returns area, the correct option for this box is area = length * width."

    show solution third with dissolve
    e "Now, let's move to the main() function. The first box in the main() block is for variable declaration."
    show solution third point with dissolve
    e "Since we're calculating the area of a rectangle, we need to declare a variable for length."
    show solution third option with dissolve
    e "At this point, the correct answer could be length = 10 or len = 10, but let's solve the next box to confirm."

    show solution fourth with dissolve # put?? in third block
    e "Box 4 is for calling the calculate_area() function and assigning its result to the area variable, which is printed afterward."
    show solution fourth option with dissolve
    e "The correct option for this box is area = calculate_area(length, width), since the other option only passes width, which isn't valid."

    show solution third fourth with dissolve
    e "Now let's go back to Box 3. Since length is used as a parameter in the function call in Box 4, we can confidently say the correct answer for Box 3 is `length = 10`"

    show solution fifth with dissolve
    e "Finally, the last box remains. We've completed the main() block, but to execute the program, we need to call main()."
    show solution fifth option with dissolve
    e "The correct answer for the last box is main()."
    show solution with fade
    show ale speaking hand both wrist at aleAlign with dissolve
    e "I know it looks a bit long, but trust me, it's simple once you break it down step by step."
    show ale standing hand left side with dissolve
    k "Thank you so much for making this crystal clear."
    call afterDragNDrop
    return
    
label afterDragNDrop:
    $ emit_learning_context_update(
        topic_id=TELEMETRY_TOPIC_IDS["call_stack"],
        objective="Understand call stack push/pop order during function calls",
        difficulty="medium",
        tags=["call_stack", "execution_order", "functions"]
    )
    $ emit_player_state_update({"phase": "call_stack_section_started"})
    scene bg classroom with fade
    show ale standing hand left side at aleAlign with dissolve
    show ale speaking hand left side at aleAlign with dissolve
    e "There's one more topic to cover before we call it a day, it's important to understand how Python handles function calls behind the scences."
    show ale speaking hand both fold with dissolve
    e "Let's talk about the call stack."
    show ale explaining hand both down front with dissolve
    e "The call stack is a special part of memory that Python uses to remember which function it's currently working on, and where to return when it's done."
    e "You can imagine it like a stack of boxes or a pile of books."
    show ale speaking hand both fold with dissolve
    e "Let me with you and show it on the screen."
    hide ale
    show stack point main with fade
    e "As you can see, the first function that gets called is main(). It goes at the bottom of the stack." #arrow tala jharxa
    show stack point cal with fade
    e "main() starts executing. Eventually, it reaches the line that calls calculate_area(length, width) " #arrow pointing to that fun
    show stack point cal top with dissolve
    e "Now, Python places calculate_area() on top of the stack." # move that above stack
    e "Python begins executing calculate_area(). When it reaches the return statement, the value of area is sent back to main()" # show the arrow of return
    show stack point cal pop with dissolve
    e "The calculate_area() is now completed, so it's popped off the stack." #remove stack. 
    e "Python always runs the function at the top of the stack. When that function finishes, Python pops it off the stack and then continues running the function that's now on top."
    e "It's like opening notebooks one at a time, top to bottom, and then closing them in reverse."
    e "The *area* variable in the main function is assigned with the return value from calculate_area() function so, in this case, the *area* variable receives a value of 50"
    e "When main() finishes executing, it's removed from the stack too." 
    show stack point main pop with fade
    e "And now, the stack is empty!"# pop out the main() also.
    $ emit_player_state_update({"phase": "call_stack_learned"})
    
    #Last Question
    scene bg classroom with fade
    show ale standing hand both fold at aleAlign with dissolve
    show ale speaking hand both fold at aleAlign with dissolve 
    $ emit_dialogue(TELEMETRY_DIALOGUE_IDS["after_stack_prompt"], "e", "Which function was the last to be removed from the stack?")
    e "Alright, Kevin. One last check before we end the session."
    show ale question hand right down at aleAlign with dissolve
    e "Which function was the last to be removed from the stack?"
    show ale standing hand both fold with dissolve
    python:
        emit_quiz_started(
            quiz_id=TELEMETRY_QUIZ_IDS["stack_last_removed"],
            question_id=TELEMETRY_QUESTION_IDS["stack_last_removed_1"],
            extra={"question_text": "Which function was last removed from the stack?", "max_attempts": 1}
        )
    $ emit_player_prompt_started("stack_last_removed_choice", "menu")
    menu:
        "Which function was the last to be removed from the stack?"
        "calculate_area()":
            $ emit_player_prompt_resolved("stack_last_removed_choice", "selected_calculate_area")
            $ emit_choice_made("final_stack_quiz_wrong", "calculate_area()")
            python:
                emit_quiz_submitted(
                    quiz_id=TELEMETRY_QUIZ_IDS["stack_last_removed"],
                    question_id=TELEMETRY_QUESTION_IDS["stack_last_removed_1"],
                    is_correct=False,
                    extra={"attempt_number": 1, "student_answer": "calculate_area()"}
                )
            call lastWrong
        "main()":
            $ emit_player_prompt_resolved("stack_last_removed_choice", "selected_main")
            $ emit_choice_made("final_stack_quiz_correct", "main()")
            python:
                emit_quiz_submitted(
                    quiz_id=TELEMETRY_QUIZ_IDS["stack_last_removed"],
                    question_id=TELEMETRY_QUESTION_IDS["stack_last_removed_1"],
                    is_correct=True,
                    extra={"attempt_number": 1, "student_answer": "main()"}
                )
            call lastCorrect
    return
    
    
label lastCorrect:
    show ale speaking hand both fold at aleAlign with dissolve
    e "Correct! main() was the last to be removed after it finished executing. Great job remembering the flow!"
    call ending
    return
label lastWrong:
    show ale explaining hand both down front at aleAlign with dissolve
    e "Close, but not quite. calculate_area() was removed first when right after it returned a value. The last one to go was main()."
    call ending
    return
    

label ending: 
    scene bg classroom with fade
    show ale speaking hand both wrist at aleAlign with dissolve
    e "And that brings us to the end of today's session"
    show ale standing hand both wrist at aleAlign with dissolve
    k "Wow.... I can't believe how much I learned in just one day. I actually understand functions now!"
    show ale speaking hand left side with dissolve
    e "You've done amazing, Kevin. You just needed the right push, and a little patience."
    show ale standing hand left side with dissolve
    k "Thanks to you, I finally feel ready for tomorrow’s exam."
    show ale speaking hand one fold with dissolve
    e "Remember, programming is all about solving problems step by step. You've got this."
    show ale standing hand both fold with dissolve
    k "I’ll review everything again tonight, but yeah, I’m feeling confident."
    show ale speaking hand both wrist with dissolve
    e "Let's pack up and head home."#now scence change in ale standing

    play sound "hallway.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg road with Fade(0.5,1,1)
    show ale bye at finalAlign
    e "Bye-bye, Kevin! See you tomorrow in class."
    show ale speaking hand both wrist at finalAlign with dissolve
    e"And hey, all the best for the exam!"
    show ale standing hand both wrist at finalAlign with dissolve
    k "You too, Emma. You're the best, you're going to crush the exam."
    show ale blush wave at finalAlign with dissolve
    e "Come on, Kevin. Alright, see you tomorrow!"
    scene bg ale final bye with fade
    # now ale start walking. 
    k "She really is the best. I'm going to give it everything tomorrow."
    k "it’s already 6! I better head home now."
    scene black with fade
    with Pause(2.0)
    hide ale
    show text "Thank you for Playing and Learning!" with dissolve
    with Pause(4.0)
    $ emit_game_ended(
        final_scene="ending",
        extra={
            "completion_status": "full_completion",
            "total_wrong_attempts": _telemetry_runtime_state.get("wrong_attempt_count", 0),
            "total_hints_used": _telemetry_runtime_state.get("hints_used", 0)
        }
    )
    return
