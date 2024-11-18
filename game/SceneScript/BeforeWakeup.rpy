define k = Character("Kevin")
define a = Character("Alejendra")
define t = Character("Teacher")

label inbed: 
    play sound "dream.mp3" fadein 1.0 fadeout 1.0
    scene bg dream with fade
    t "Kevin, You Failed the Introduction to Programming exam. You need to focus more on class"
    t "Did you hear me?" 

    play voice "morningalaram.mp3" fadein 2.0 fadeout 2.0
    scene bg wakeup with Fade(0.5,4.0,0.5)
    k "Ahh, another nightmare! Why does Intermediate Programming haunt me like this? Why is it so hard?"
    k "Shoot! Its's already 8 AM! ONly 30 minutes until my first Class. I better get ready" 

    play sound "classroom.mp3" fadein 1.0 fadeout 2.0 loop
    scene bg fromdoor with Fade(1.0,3.5,0.9) 
    with Pause(2.0)
    k "Finally I made it in time"
    scene bg clocktower with Dissolve(3.0)
    play voice "CollegeBell2.mp3" fadein 2.0 fadeout 2.0
    with Pause(5.0)

    scene bg teacher writing with fade
    with Pause(2.0)
    scene bg teacher afterwriting with dissolve
    with Pause(3.0)
    k "Function? What's that? I've never even heard of it. This is probably going to be another boring topic that I'll forget instantly"

    scene bg after30 with pushleft 
    with Pause(3.0)
    scene bg teacher afterclass with Fade(1.0,1.0,1.0)
    with Pause(1.0)
    t " There will be a test on Function next class, so be prepared"
    k "Not again! A test already? I have to figure this out. I guess I'll need Ale's help"
    play voice "CollegeBell2.mp3" fadein 1.0 fadeout 2.0

    ## Now hallway scene start
    return