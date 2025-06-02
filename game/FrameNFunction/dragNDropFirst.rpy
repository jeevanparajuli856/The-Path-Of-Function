label dragqns:
    hide ale
    call screen drag_drop
    return

screen drag_drop: ## creating the separate screen for the qns over the main scree
    image "images/dragqns/drag background.png"
    add my_qnsAnswerGroup
    imagebutton:
        idle "images/dragqns/buttons.png"
        xpos 1322 #defining the submit button of qns
        ypos 889
        action Function(submission) #calling the function to check the answer
    
init python:
    global counter
    counter =2
    dropBoxStates={ #dictionary to track the each box dropped value
        "box1":None,
        "box2":None,
        "box3":None,
        "box4":None,
        "box5":None,
    }
    count=2
    def dragged_func(dragged_items,dropped_on): #creating the callable to control dragged item behaviour
        dragged_name = dragged_items[0].drag_name #getting the drag item name
        if dropped_on is not None: #if the box is occupied
            if dropBoxStates[dropped_on.drag_name] is not None: 
                dragged_items[0].snap(dragged_items[0].start_x,dragged_items[0].start_y,0.2) #if dragged and near to drop iteam then snappped to drop box
            else: # when box isnt occupied
                dragged_items[0].snap(dropped_on.x+8,dropped_on.y+8,0.2)
                dropBoxStates[dropped_on.drag_name]=dragged_name
        else: #when drag is removed from box
            for box, occupant in dropBoxStates.items(): #This loop make sure if drag and dropped in box and again dragged out, the drop box is vacant again
                if occupant == dragged_name:
                    dropBoxStates[box]=None
                    break
                    

    def submission(): #function to check the answer is correct or not
        count=counter
        print(count)
        if(dropBoxStates["box1"]!=None and dropBoxStates["box2"]!=None and dropBoxStates["box3"]!=None and dropBoxStates["box4"]!=None and dropBoxStates["box5"]!=None): #checking drop box is empty or not
            if dropBoxStates["box1"]=="optC1" and dropBoxStates["box2"]=="optC2" and dropBoxStates["box3"]=="optC3" and dropBoxStates["box4"]=="optC4" and dropBoxStates["box5"]=="optC5" :
                renpy.call("qnsSolved") 
            else:
                dropBoxStates["box1"]=None
                dropBoxStates["box2"]=None
                dropBoxStates["box3"]=None
                dropBoxStates["box4"]=None
                dropBoxStates["box5"]=None
                count =2
                renpy.call("qnsUnsolve")
                





















default areaM1 = Drag(d = Image("images/dragopt/areaM1.png"),xpos=50,ypos=278,drag_name = "optN1",drag_raise=True,droppable=False,dragged = dragged_func)
default areaF1 = Drag(d = Image("images/dragopt/areaF1.png"),xpos=50,ypos=465,drag_name = "optN3",drag_raise=True,droppable=False,dragged = dragged_func)
default defcal2 = Drag(d = Image("images/dragopt/defcal2.png"),xpos=50,ypos=568,drag_name = "optN4",drag_raise=True,droppable=False,dragged = dragged_func)
default len2 = Drag(d = Image("images/dragopt/len2.png"),xpos=50,ypos=854,drag_name = "optN5",drag_raise=True,droppable=False,dragged = dragged_func)

default defcal1 = Drag(d = Image("images/dragopt/defcal1.png"),xpos=50,ypos=180,drag_name = "optC1",drag_raise=True,droppable=False,dragged = dragged_func)
default areaF2 = Drag(d = Image("images/dragopt/areaF2.png"),xpos=50,ypos=661,drag_name = "optC2",drag_raise=True,droppable=False,dragged = dragged_func)
default len1 = Drag(d = Image("images/dragopt/len1.png"),xpos=50,ypos=376,drag_name = "optC3",drag_raise=True,droppable=False,dragged = dragged_func)
default areaM2 = Drag(d = Image("images/dragopt/areaM2.png"),xpos=50,ypos=755,drag_name = "optC4",drag_raise=True,droppable=False,dragged = dragged_func)
default main = Drag(d = Image("images/dragopt/main.png"),xpos=50,ypos=942,drag_name = "optC5",drag_raise=True,droppable=False,dragged = dragged_func)

#box
default box1 = Drag(d = Image("images/dropbox/box1.png"),xpos=1047,ypos=132,drag_name = "box1",drag_raise=True,droppable=True,draggable=False)
default box2 = Drag(d = Image("images/dropbox/box1.png"),xpos=1152,ypos=238,drag_name = "box2",drag_raise=True,droppable=True,draggable=False)
default box3 = Drag(d = Image("images/dropbox/box1.png"),xpos=1152,ypos=454,drag_name = "box3",drag_raise=True,droppable=True,draggable=False)
default box4 = Drag(d = Image("images/dropbox/box1.png"),xpos=1152,ypos=612,drag_name = "box4",drag_raise=True,droppable=True,draggable=False)
default box5 = Drag(d = Image("images/dropbox/box1.png"),xpos=1047,ypos=783,drag_name = "box5",drag_raise=True,droppable=True,draggable=False)

default my_qnsAnswerGroup = DragGroup(defcal1,areaM1,areaF1,areaF2,defcal2,len1,len2,areaM2,main,box1,box2,box3,box4,box5)
 