import {v} from '../../engine/js/e.js';

// progress 0..1 -> eased 0..1. sin(p * pi/2) is the positive quarter of the sine,
// squared so it also starts slow. only ever heads toward the target, never past it
export function sin_ease(p){
  const rise = Math.sin(Math.min(Math.max(p, 0), 1) * Math.PI * 0.5);
  return rise * rise;
}

// one number easing toward a target. retargeting mid-flight restarts from wherever
// it is now, so nothing jumps
export class tween {
  constructor(value, duration){
    this.value = value;
    this.duration = duration;
    this.from = value;
    this.to = value;
    this.start = 0;
    this.active = false;
  }

  // park it on a value by hand, with no target, so the next go() always runs
  set(value){
    this.value = value;
    this.to = NaN;
    this.active = false;
    return this;
  }

  // delay holds it at its current value for that many seconds before it moves
  go(sv, to, delay = 0){
    if(to === this.to) return this;
    this.from = this.value;
    this.to = to;
    this.start = sv.tm + delay;
    this.active = true;
    return this;
  }

  step(sv){
    if(!this.active) return this;
    const p = (sv.tm - this.start) / this.duration;
    this.value = this.from + (this.to - this.from) * sin_ease(p);
    if(p >= 1) this.active = false;
    return this;
  }
}

// moves the camera (sv.a) between named spots. nothing in the scene is touched, so
// everything else stays put in world space. call step() once a frame
export class camera_move {
  constructor(start, duration){
    this.x = new tween(start.x, duration);
    this.y = new tween(start.y, duration);
    this.z = new tween(start.z, duration);
    this.key = null;
  }

  // true when the camera is already there or on its way
  heading(key){
    return this.key === key;
  }

  // heading there and done moving
  arrived(key){
    return this.heading(key) && !this.x.active && !this.y.active && !this.z.active;
  }

  go(sv, key, target){
    if(this.heading(key)) return this;
    this.key = key;
    this.x.go(sv, target.x);
    this.y.go(sv, target.y);
    this.z.go(sv, target.z);
    return this;
  }

  step(sv){
    sv.a = new v(this.x.step(sv).value, this.y.step(sv).value, this.z.step(sv).value);
    return this;
  }
}
