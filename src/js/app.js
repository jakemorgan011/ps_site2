const c = document.querySelector('#m'); // put the canvas tag here. 
const gl = canvas.getContext('webgl2');

if(!gl){
  throw new Error('no gl');
}
