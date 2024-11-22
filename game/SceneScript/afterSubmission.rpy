label qnsSolved:
    scene bg classroom with fade
    show ale standing hand both wrist at aleAlign with dissolve
    show ale speaking hand both wrist at aleAlign with dissolve
    a "That's awesome, Kevin! You did it!"
    show ale speaking hand together with dissolve
    a "You got all the answers right. I'm so proud of you!"
    show ale standing hand both fold with dissolve
    k "Thank you, Emma! I couldn't have done it without you."
    k "Really, all the credit goes to you."
    show ale blush fold with dissolve
    a "Oh, stop it! You're the one who put in all the effort."
    show ale speaking hand left side with dissolve
    a "But hey, would you like me to go over the answer to this question just to make sure everything's clear?"
    menu:
        "Do you want Emma to explain you the answer to the question?"
        "Yes":
            call yesExplain
        "No":
            call noExplain
    return
     

label qnsUnsolve:
    scene bg classroom with fade
    show ale standing hand both wrist at aleAlign with dissolve
    show ale sad hand both wrist at aleAlign with dissolve
    a "Oops, that's not quite right, Kevin! Looks like you got a bit stuck in the middle."
    show ale speaking hand together with dissolve
    a "No worries, let me help you figure this out step by step."
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
    k "It's already 6 PM, and I feel pretty confident now."
    k "I don't want to take up more of your time."
    show ale speaking hand both fold at aleAlign with dissolve
    a "Alright, Kevin. You did great today."
    call ending
    return
    

label puzzleExplaination:
    show ale speaking hand both fold with dissolve
    a "Let me sit beside you and explain the solution to that question."
    scene bg classroom with fade

    show solution first with dissolve
    a "Let's start with the first box. It's for the function declaration, which calculates the area of a rectangle."
    a "We can confirm this from the print() statement inside the main() block."
    show solution first option with dissolve
    a "There are two options for the function definition, but we'll pick the first box: def calculate_area(length, width)."
    a "The second option only uses width, but to calculate the area, we need both length and width."
    show solution second with dissolve
    a "Next is the second box. This box contains the core logic of the function: multiplying length and width and storing the result in the variable area."
    show solution second option with dissolve
    a "Since the function clearly returns area, the correct option for this box is area = length * width."

    show solution third with dissolve
    a "Now, let's move to the main() function. The first box in the main() block is for variable declaration."
    show solution third point with dissolve
    a "Since we're calculating the area of a rectangle, we need to declare a variable for length."
    show solution third option with dissolve
    a "At this point, the correct answer could be length = 10 or len = 10, but let's solve the next box to confirm."

    show solution fourth with dissolve # put?? in third block
    a "Box 4 is for calling the calculate_area() function and assigning its result to the area variable, which is printed afterward."
    show solution fourth option with dissolve
    a "The correct option for this box is area = calculate_area(length, width), since the other option only passes width, which isn't valid."

    show solution third fourth with dissolve
    a "Now let's go back to Box 3. Since length is used as a parameter in the function call in Box 4, we can confidently say the correct answer for Box 3 is `length = 10`"

    show solution fifth with dissolve
    a "Finally, the last box remains. We've completed the main() block, but to execute the program, we need to call main()."
    show solution fifth option with dissolve
    a "The correct answer for the last box is main()."
    show solution with fade
    show ale speaking hand both wrist at aleAlign with dissolve
    a "I know it looks a bit long, but trust me, it's simple once you break it down step by step."
    show ale standing hand left side with dissolve
    k "Thank you so much for making this crystal clear."
    call ending
    return

label ending:
    scene bg classroom with fade
    show ale standing hand left side at aleAlign with dissolve
    show ale speaking hand left side at aleAlign with dissolve
    a "There's one more topic to cover, but let's save it for tommorrow morning."
    show ale standing hand both fold with dissolve
    k "Alright, Emma! Let's head home."
    scene bg hallway with fade
    show ale standing hand left side at aligner with dissolve
    show ale hello at aligner with dissolve
    a "Bye Kevin! It was fun teaching you today."
    show ale standing hand both fold at aligner  with dissolve
    k "Bye, Emma! And thank you so much for your time. See you tomorrow at 8."
    show ale blush wave with dissolve
    a "See you."
    scene bg tobecontinued with fade
    with Pause(2.0)
    return 