
define aligner = Position(xpos = 550, xanchor = 10, ypos=-10, yanchor=1) #defining the fix postion to determine the where the character gonna appear
label hallway:
    play sound "hallway.mp3" fadein 1.0 fadeout 2.0 loop #changing the sound in the game
    scene bg hallway backale with Fade(1.0,4.0,0.9) #hallway scene where kevin and ale meet
    with Pause(1.0)
    k "Hey, Emma!"
    scene bg hallway with fade
    show ale hello at aligner with dissolve
    a "Hi, Kevin! What's up?"
    show ale standing hand left side with dissolve
    k "Not much. Just trying to survive our Introduction to programming class."
    show ale speaking hand both fold with dissolve
    a "Is there anything I can do for help"
    show ale standing hand both fold with dissolve
    k "That would be great!!! I'm struggling. Functions have me completely lost."
    show ale blush fold with fade
    a "Oh no! Don't worry, I've got your back."
    show ale standing hand one fold with dissolve
    k "You're the Introduction to programming  queen! Do you have time later today to go over function material discussed in class together??"
    show ale speaking hand one fold with dissolve
    a "Of course! Where do you want to meet and at what time?"
    show ale standing hand left side with dissolve
    k "The computer science major lab should be empty after 5 P.M. Does that work?"
    show ale speaking hand together with dissolve
    a "Perfect! I'll meet you there."
    show ale bye at aligner with dissolve 
    a "See you later, Kevin!"
    k "See you, Emma! And thanks—you're the best!"
    #completion of hallway scene
    return