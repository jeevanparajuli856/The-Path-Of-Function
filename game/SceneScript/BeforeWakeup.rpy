define k = Character("Kevin") #defination of character 
define a = Character("Emma")
define t = Character("Teacher")

label inbed: 
    play sound "dream.mp3" fadein 1.0 fadeout 1.0 loop  #using loop to loop the using
    #Using different trasition in the script to maintain the flow of character expression and scene

    # scene first where kevin dreaming
    scene bg dream with fade #need to change this background so that its looks like dreamn add with cloud.
    t "Kevin, You failed the last Introduction to Programming exam. This isn't acceptable—you need to start taking this classes seriously!"
    scene bg dream scolding with dissolve
    t"Kevin?... Kevin?...Kevin?... Kevin?..."
    t "Are you even listening to me?" 

    #after dream
    play voice "morningalaram.mp3" fadein 2.0 fadeout 2.0
    scene bg 8am with fade
    with Pause(2)
    scene bg wakeup2 with dissolve
    k "Ugh, another nightmare! Why does Introduction to Programming keep haunting me? Why is it so impossible to figure out?"
    k "Oh no! It's already 8 AM! Only 30 minutes until class. I've got to move fast!" 

    #after reaching to the college
    play sound "classroom.mp3" fadein 1.0 fadeout 2.0 loop
    play voice "CollegeBell2.mp3" fadein 2.0 fadeout 2.0
    scene bg classentry with Fade(1.0,3.5,0.9) 
    with Pause(2.0)
    k "Phew! I actually made it on time. That was way too close!"
    with Pause(2.0)

    #Teacher start to teach in class
    scene bg teacher writing with fade
    with Pause(2.0)
    scene bg teacher explaining with fade
    with Pause(3.0)
    k "Functions? What are function? Sounds like another boring topic I'll never understand or remember..."

    #kevin thinking in class
    scene bg after30 with zoomin 
    with Pause(3.0)
    scene bg teacher afterclass with Fade(1.0,1.0,1.0)
    t "There will be a test on functions in the next class, so make sure you're prepared."
    scene bg teacher standing with fade
    k "A test? Already? You've got to be kidding me! I really need to figure this out... Guess I'll ask Emma for help again."
    play voice "CollegeBell2.mp3" fadein 1.0 fadeout 2.0

    ## Now hallway scene start
    return