define k = Character("Kevin")

define aligner = Position(xpos = 550, xanchor = 10, ypos=-10, yanchor=1)
define a = Character("Alejendra")
label hallway:
    play sound "hallway.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg hallway backale with Fade(1.0,4.0,0.9)
    with Pause(1.0)
    k "Hey, Ale!!"

    scene bg hallway with fade
    show ale hello at aligner with dissolve
    a "Hello, Kevin"
    show ale speaking hand left side with dissolve
    a "How are you today?"
    show ale standing hand left side with dissolve
    k "I am doing fine ale!"
    k "How about you my friend"
    show ale speaking hand both fold with dissolve
    a "I am doing great kevin"
    show ale standing hand both fold with dissolve
    k "You looking so pretty today my friend"
    show ale blush wave with fade
    a "Common!! kevin, I am blushing now. Anyway Thank you"
    show ale standing  hand one fold with dissolve
    k " Can I ask for a favor? You're the queen of Computer Science, and my best Friend.... I'm totally lost with Functions. Can you teach me after classes today?"
    show ale speaking hand one fold with dissolve
    a "Of course, kevin! Anything for my best Friend."
    show ale speaking hand left side with dissolve
    a "Where do you want to study?"
    show ale standing hand left side with dissolve
    k " How about in the smart lab class?"
    k "It should be empty after 5 PM"
    show ale speaking hand together with dissolve
    a "Sound perfect! See you there at 5"
    show ale bye at aligner with dissolve 
    a "Bye Kevin!!!!"
    k "Bye Ale!! See you!"
    return