// dimensionality page with dynamic OBJ loading

let sketch_dimensionality = function(p){
  let obj = null;
  let uploadedObj = null;
  let objScale = 70.0;
  
  p.setup = function(){
    p.createCanvas(600, 600, p.WEBGL);
    p.angleMode(p.DEGREES);
    
    // Try to load default model
    try {
      p.loadModel('src/assets/stasis.obj', 
        (model) => {
          obj = model;
          console.log('Default model loaded');
        },
        true,
        () => {
          console.log('Default model not found, that\'s okay');
        }
      );
    } catch(e) {
      console.log('Could not load default model');
    }
    
    // Listen for OBJ file uploads
    if (document.getElementById('obj-input')) {
      document.getElementById('obj-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.name && file.name.toLowerCase().endsWith('.obj')) {
          const reader = new FileReader();
          
          reader.onload = function(event) {
            // Parse OBJ text directly to avoid p5.js loader issues
            const objText = event.target.result;
            
            // Create blob URL for p5.js to load
            const blob = new Blob([objText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            p.loadModel(url, 
              (model) => {
                uploadedObj = model;
                URL.revokeObjectURL(url);
                console.log('Uploaded model loaded');
                
                // Update status
                if (document.getElementById('status-text')) {
                  document.getElementById('status-text').textContent = 'Model loaded!';
                }
              },
              true, // normalize
              (err) => {
                console.error('Error loading uploaded model');
                URL.revokeObjectURL(url);
              }
            );
          };
          
          reader.readAsText(file);
        }
      });
    }
  };
  
  p.draw = function(){
    p.background(252, 252, 255);
    
    // Simple lighting setup
    p.lights();
    p.ambientLight(50);
    p.directionalLight(255, 255, 255, 0, 0, -1);
    
    p.push();
    
    // Animation
    p.rotateX(p.frameCount * 0.3);
    p.rotateY(p.frameCount * 0.02);
    p.rotateZ(180 + p.frameCount * 0.06);
    
    // Material
    p.normalMaterial();
    p.noStroke();
    
    // Scale
    p.scale(objScale);
    
    // Display model in priority order
    if (uploadedObj) {
      p.model(uploadedObj);
    } else if (obj) {
      p.model(obj);
    } else {
      // Fallback geometry if no models loaded
      p.box(1);
    }
    
    p.pop();
  };
};

// Initialize the sketch
let dimensionality_p5 = new p5(sketch_dimensionality, 'canvas-container-dimensionality');
