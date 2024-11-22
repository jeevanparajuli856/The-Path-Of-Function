screen notiGuide(chance):
    frame: #Separate frame for the notificatio of error
        background Frame("images/notification/notiplace.png")
        xalign 0.0
        yalign 0.0
        xsize 780
        ysize 170
        vbox:
            text "Ouch!! It's wrong answer you have [chance] more chance left!! " style "noti_styles"
        timer 2.0 action Return()
style noti_styles:
    color "#000000"
    xsize 650
    ysize 175
    xpos 30
    ypos 20
    size 30
            