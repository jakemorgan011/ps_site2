

let sketch_horse = function(p){
  let horse;
  p.setup = function(){
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
  };
  p.preload = function(){
    horse = p.loadModel('/src/assets/horse.obj');
  }
  
  p.draw = function(){
    p.background(252,252,255);
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(100);
    p.rotateZ(180);
    p.scale(4.0); // change this to scale with screen size for proper displays.
    p.model(horse);
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ(p.frameCount - offset);
    p.rotateY(p.frameCount - offset);
    p.rotateX(p.frameCount - offset);
  }
}

let sketch_cube = function(p){
  p.setup = function(){
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
  };
  p.draw = function(){
    p.background(252,252,255);
    //box
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(0);
    p.box(75,75,75);
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ(p.frameCount - offset);
    p.rotateY(p.frameCount - offset);
    p.rotateX(p.frameCount - offset);
  }
}
/*
function setup(){
  createCanvas(500,500,WEBGL);
  angleMode(DEGREES);
  normalMaterial();
}

// going to need aspect ratio converter...

function draw(){
  background(252, 252, 255);
  // horse
  push();
  translate(0,0,0);
  rotateWithFrameCount(100);
  rotateZ(180);
  scale(4.0);
  model(horse);
  pop();
}
*/
function calcAspect(){
}


let horse_p5 = new p5(sketch_horse, 'canvas-container-horse');
let cube_p5 = new p5(sketch_cube, 'canvas-container-cube');
