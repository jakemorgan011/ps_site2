function setup(){
  createCanvas(500,500,WEBGL);
  angleMode(DEGREES);
  normalMaterial();
}

function draw(){
  background(252, 252, 255);
  // make box
  push();
  translate(0,0,0);
  rotateWithFrameCount();
  box(75,75,75); // could make some cool dynamic stuff here
  // OR make some fancy vertex calculation stuff aswell.
  pop();
}

// git test
function rotateWithFrameCount(){
  rotateZ(frameCount);
  rotateY(frameCount);
  rotateX(frameCount);
}
