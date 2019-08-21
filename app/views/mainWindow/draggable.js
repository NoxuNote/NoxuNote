/**
 * draggable.js - Make an element nammed "X" with a child nammed "Xheader" mouse mouvable
 * make sur to have set the position to absolute in the X style properties.
 * Source : w3schools.com (edited for NoxuNote)
 */

//Make the DIV element draggagle:
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * ELEMENTS LIST
 */

dragElement(document.getElementById(("toDoBlock")));
// Resetting element position on window resize
window.addEventListener('resize', function(event, elmnt){
    var elmnt = document.getElementById("toDoBlock");
    elmnt.style.top = "130px";
    elmnt.style.left = null;
    elmnt.style.right = "50px";
});