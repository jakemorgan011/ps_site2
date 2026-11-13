import {v} from '../../engine/js/e.js';

// fisheye.wgsl's radial map in js, in ndc (-1..1 both axes). the filter samples
// the scene at to_scene(screen), so a point in the scene shows up on screen at
// to_screen(point). hit tests and anything html laid over the canvas go through it
//
//   scene r  = atan(screen r * k) / atan(k)
//   screen r = tan(scene r * atan(k)) / k
export class lens {
  constructor(k){
    this.k = Math.max(k, 0.001);
  }

  to_scene(p){
    const r = Math.hypot(p.x, p.y);
    return this._rescale(p, r, Math.atan(r * this.k) / Math.atan(this.k));
  }

  to_screen(p){
    const r = Math.hypot(p.x, p.y);
    return this._rescale(p, r, Math.tan(r * Math.atan(this.k)) / this.k);
  }

  _rescale(p, r, to){
    if(r === 0) return new v(0, 0);
    return new v(p.x / r * to, p.y / r * to);
  }
}
