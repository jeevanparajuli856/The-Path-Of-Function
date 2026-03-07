# The script of the game goes in this file.

# Declare characters used by this game. The color argument colorizes the
# name of the character.

define k = Character("Kevin")
define a = Character("Emma")
define t = Character("Teacher")

# The game starts here.

label start:
    python:
        reset_telemetry_state()
        emit_scene_start(TELEMETRY_SCENE_IDS["start"])
        emit_player_state_update({"phase": "start_initialized"})

    stop music fadeout 1.0 
    call inbed #first scene before wakeup 
    call hallway # hallway scene with emma
    call hallwayafter # after deciding they gonna meet
    call teachingfirst # first part of teaching
    call teachingSecond # Second teaching
    return
