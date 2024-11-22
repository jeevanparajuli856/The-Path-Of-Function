label hallwayafter:
    play sound "learning.mp3" fadein 1.0 fadeout 2.0 loop #changing the sound
    scene bg 5pm with Fade(1.0,1.0,1.0)
    with Pause(3.0)
    scene bg hallway with dissolve
    show ale hello at aligner with fade
    a "Hello Kevin, I am finally here for you."
    show ale standing hand both wrist with dissolve
    k "Hi, Emma! Thank you so much for coming. I really appreciate it."
    show ale speaking hand both wrist with dissolve
    a "Of course! Now, let's head to class and get started."
    show ale question hand both down with dissolve
    a "Are you ready?"
    show ale standing hand both wrist with dissolve
    k "I am supper excited to learn from you, Emma!"
    show ale blush fold with dissolve
    k "Alright, Kevin, Let's go!"
    #The hallway after scene complete
    return