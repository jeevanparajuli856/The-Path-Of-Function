label hallwayafter:
    play sound "learning.mp3" fadein 1.0 fadeout 2.0 loop #changing the sound
    scene bg 5pm with Fade(1.0,1.0,1.0)
    with Pause(3.0)
    scene bg hallway with dissolve
    show ale standing hand both wrist at aligner with dissolve 
    k "Hi, Emma! Thank you so much for coming. I really appreciate it."
    show ale speaking hand both wrist with dissolve
    a "Of course! Now, let's head to class and get started."
    #The hallway after scene complete
    return