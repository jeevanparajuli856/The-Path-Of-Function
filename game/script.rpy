# The script of the game goes in this file.

# Declare characters used by this game. The color argument colorizes the
# name of the character.

define k = Character("Kevin")
define a = Character("Alejendra")
define t = Character("Teacher")

# The game starts here.

label start:
    stop music fadeout 1.0 
    call inbed
    call hallway
    call hallwayafter
    call teachingfirst
    call teachingSecond
    return
