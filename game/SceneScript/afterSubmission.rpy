

label qnsSolved:
    scene bg classroom with fade
    show ale speaking at aleAlign with dissolve
    a "That's great, Kevin. You made it!"
    show ale speaking second with dissolve
    a "You sucessfully completed the program."
    show ale standing with dissolve
    k "Thank you, Ale! I woundn't have done it without you"
    k "All credit goes to you"
    show ale blushing with dissolve
    a "Oh, stop it! You did all the hard work. Do you wnat me to explain the answer to this question"

    return
     

label qnsUnsolve:
    scene bg classroom with fade
    show ale speaking at aleAlign with dissolve
    a "Seems like you got stuck in the middle, kevin"
    show ale speaking second with dissolve
    a "Let me help you solve this puzzle"
    show ale standing with dissolve
    k "Yeah, Ale! I got a bit confused in the middle"
    call puzzleExplaination
    return

label puzzleExplaination:
    show ale speaking with dissolve
    a "Then, Let me side beside you and explain the solution for that question"
    scene bg classroom with fade

    show solution first with dissolve
    a "Let's start form the first box. It's for the function declaration. The function is about the calculationg the area of a rectangle, and we can comfirm that from the print() statement inside the main() block."
    show solution first option with dissolve
    a "There are two options for the function defination, but we'll pick the first box: def calculate_area(length,width)"
    a "As the second option only uses width, but for the ara, we need both length and width"
    show solution second with dissolve
    a "Now it's time to fill the second box. This box contains the main behaviour of the function: multiplying length and width and storing the result in area."
    show solution second option with dissolve
    a "Since the funciton clearly return area, the correct option for this box is area = length*width."

    show solution third with dissolve
    a "Then, let's move inside the main() funciton. As you know, the main() function holds the primary logic of the program."
    show solution third point with dissolve
    a "The first box in the main() block is for variable declaration. We're trying to find the area of a rectangle, but there's no variable for length yet."
    show solution third option with dissolve
    a "So, the correct answer should be length =10 or len =10. But to confirm this, let's solve the next block first, as we don't know yet which variable is used in the function call."

    show solution fourth with dissolve # put?? in third block
    a "Box 4 is calling the calculate_are() function and assigning its result to the area varaible, which is printed afterward"
    show solution fourth option with dissolve
    a "The correct option for this box is area = calculate_area(length,width), as the other option only passes width, which isnt valid."

    show solution third fourth with dissolve
    a "Now let's go back to Box 3. Since we're passing length as a parameter in the function call in Box4, we call in Box 4, we can confidently say the correct option for Box 3 is length =10"

    show solution fifth with dissolve
    a "Finally, the last box is left. So far, we've completed the main() block. To execute the program, we need to call main()"
    show solution fifth option with dissolve
    a "The correct answer for the last box is main()"
     
    call ending
    return

label ending:
    scene bg classroom with fade
    show solution with fade
    show ale speaking at aleAlign with dissolve
    a "I know it looks a bit long, but trust me, it's simple once you break it down step by step."
    show ale standing with dissolve
    k "Thank you so much for making this crystal clear."
    show ale speaking with dissolve
    a "There's one more topic to cover, but let's leave it for tommorrow morning."
    show ale standing with dissolve
    k "Alright, Ale! Let's head home."
    scene bg hallway with fade
    show ale hello at aleAlign with dissolve
    a "Bye Kevin! It was fun teaching you today."
    show ale standing with dissolve
    k "Bye, Ale! And thank you so much for your time. See you tomorrow at 8."
    show ale speaking with dissolve
    a "See you."
    scene bg tobecontinued with fade
    with Pause(2.0)
    return 