define k = Character("Kevin")
define a = Character("Alejendra")
define aligner = Position(xpos = 550, xanchor = 10, ypos=-10, yanchor=1)
label hallwayafter:
    play sound "learning.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg after30 with Fade(1.0,1.0,1.0)
    with Pause(3.0)
    scene bg hallway with dissolve
    k "Huh!! Its already been 4:00 pm."
    k "Ale isnt still here!!"
    show ale hello at aligner with fade
    a "Hello kevin I am finally here now for you"
    show ale speaking at aligner with dissolve
    a "Soo sorry for being late"
    show ale listening ask at aligner with dissolve
    k "Its fine ale!! I understand you busy schedule."
    k "Thank you soo much for comming!"
    show ale speaking at aligner with dissolve
    a "That my best friend. You understand my problem"
    show ale speaking second at aligner with dissolve
    a "I was stuck in a meeting my professor regarding research."
    a "It went a bit long"
    show ale listening neutral at aligner with dissolve
    k "No worries ale! I can wait forever for my best Friend!"
    show ale blushing at aligner with dissolve 
    a "Thank you kevin!! You are the best"
    show ale speaking at aligner with dissolve
    a "Now lets go the class and lets start to read"
    a "Are you ready?"
    show ale listening ask at aligner with dissolve
    k "I am supper excited to learn from you! Ale"
    show ale blushing at aligner with dissolve
    k "Alright kevin lets go!!!!!!!!!!"
    return