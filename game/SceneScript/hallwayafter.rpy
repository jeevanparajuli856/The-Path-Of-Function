define k = Character("Kevin")
define a = Character("Alejendra")
define aligner = Position(xpos = 550, xanchor = 10, ypos=-10, yanchor=1)
label hallwayafter:
    play sound "learning.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg 5pm with Fade(1.0,1.0,1.0)
    with Pause(3.0)
    scene bg hallway with dissolve
    show ale hello at aligner with fade
    a "Hello Kevin, I am finally here now for you"
    k "Hello Ale! Thank you soo much ale"
    show ale speaking at aligner with dissolve
    a "Now lets go the class and lets start to read"
    a "Are you ready?"
    show ale listening ask at aligner with dissolve
    k "I am supper excited to learn from you! Ale"
    show ale blushing at aligner with dissolve
    k "Alright kevin lets go!!!!!!!!!!"
    return