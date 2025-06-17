let horse;

function preload(){
  horse = loadModel('/src/assets/horse.obj');
}

function setup(){
  createCanvas(500,500,WEBGL);
  angleMode(DEGREES);
  normalMaterial();
}

// going to need aspect ratio converter...

function draw(){
  background(252, 252, 255);
  // make box
  /*
  push();
  translate(0,0,0);
  rotateWithFrameCount(0);
  box(75,75,75); // could make some cool dynamic stuff here
  // OR make some fancy vertex calculation stuff aswell.
  pop();
  */
  // horse
  push();
  translate(0,0,0);
  rotateWithFrameCount(100);
  rotateZ(180);
  scale(4.0);
  model(horse);
  pop();
}

function calcAspect(){
}

function rotateWithFrameCount(offset){
  rotateZ(frameCount - offset);
  rotateY(frameCount - offset);
  rotateX(frameCount - offset);
}
