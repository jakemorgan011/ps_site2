import {q, rx, s} from '../../engine/js/e.js';
import {tween} from './animations.js';

// the redux block size in screen pixels, at rest and under the pointer
const ITM_PX = 8;
const ITM_PX_HOVER = 2;
const HOVER_SECONDS = 0.35;
// the float down into the column. it waits for the camera to get most of the way
// to the spokes, then each item lands FLOAT_STAGGER after the one above it
const FLOAT_SECONDS = 1.6;
const FLOAT_DELAY = 0.9;
const FLOAT_STAGGER = 0.18;
// the idle motion once they've landed, per frame like the building's bob: a sway
// about z in radians and a bob in world units. each item runs ITM_PHASE radians
// behind the one above it so they don't move in lockstep
const SWAY = 0.05;
const SWAY_SPEED = 0.013;
const BOB = 0.06;
const BOB_SPEED = 0.01;
const ITM_PHASE = 1.9;
// how much of the gap to the scroll target closes each frame
const SCROLL_EASE = 0.12;
// a touch that moves further than this, in css px, is a drag and not a tap
const DRAG_PX = 8;
// center mode (no hover on phones): the item nearest the column's centre is the
// picked one, and a drag settles so one item sits right on the centre

// a textured quad over the scene. depth 'always' like the spokes, nothing should cover it
export class gllry_rx extends rx {
  ds(){
    return {format: s.df, depthWriteEnabled: false, depthCompare: 'always'};
  }
}

// a quad hit tested where it shows up through the fisheye, not where it renders.
// same box as rn.ib(), the pointer is just taken back into scene space first
class lens_q extends q {
  ib(sv = this._sv()){
    if(!this.ln) return super.ib(sv);
    const b = this.nb(sv);
    if(!b) return false;
    const m = this.ln.to_scene(sv.ms);
    return Math.abs(m.x - b.x) <= b.hw && Math.abs(m.y - b.y) <= b.hh;
  }
}

// one thing in the gallery: a render parent holding a single quad, plus an html
// title that shows on hover, pinned under the quad's bottom left corner. the parent
// is handed in, so anything that draws a quad and takes a px uniform fits.
// oc() is the click: opens href when there is one, override it for anything else.
// entry is its entries.js row. where it sits in y is the column's call, the item
// only adds its float and bob
export class gllry_itm {
  constructor(rp, entry = {}){
    const {title = '', href = null} = entry;
    this.rp = rp;
    this.entry = entry;
    this.href = href;
    this.col = null;
    this.q = rp.ao('itm', new lens_q(false));
    this.q.oc = this.click.bind(this);
    this.px = new tween(ITM_PX, HOVER_SECONDS);
    this.drop = new tween(0, FLOAT_SECONDS);
    this.slot = {x: 0, z: 0};
    this.park = 0;
    this.shown = false;
    this.hover = false;
    this.el = document.createElement('p');
    this.el.className = 'gllry_title';
    this.el.textContent = title;
    document.body.appendChild(this.el);
  }

  // ln is the lens the scene is seen through, for the hit test and the title
  async load(shader, ln){
    this.ln = ln;
    this.q.ln = ln;
    await this.rp.s(shader);
    this.rp.su({px: ITM_PX, hv: 0});
    return this;
  }

  oc(e){
    if(this.href) window.open(this.href, '_blank', 'noopener');
  }

  click(node, e){
    if(this.shown && this.col?.live !== false && !this.col?.dragged) this.oc(e);
  }

  // its x and z, its half size, and how far above its spot it waits out of view
  place(x, z, size, park){
    this.slot = {x, z};
    this.park = park;
    this.q.ss(size);
    if(!this.shown) this.drop.set(park);
    return this;
  }

  show(sv, i){
    this.shown = true;
    this.drop.go(sv, 0, FLOAT_DELAY + i * FLOAT_STAGGER);
    return this;
  }

  hide(sv){
    this.shown = false;
    this.drop.go(sv, this.park);
    return this;
  }

  // y is its spot in the column this frame. live: the canvas is taking the pointer.
  // picked: the column's say on whether it's hovered, null = ask the pointer
  step(sv, f, i, y, live = true, picked = null){
    const ph = i * ITM_PHASE;
    this.drop.step(sv);
    this.q
      .st(this.slot.x, y + this.drop.value + Math.sin(f * BOB_SPEED + ph) * BOB, this.slot.z)
      .sr(0, 0, Math.sin(f * SWAY_SPEED + ph) * SWAY);
    // a picked item (mobile) waits until it has landed, or its title rides the float in
    const pick = picked === null ? this.q.ib(sv) : picked && !this.drop.active;
    this.hover = this.shown && live && pick;
    this.px.go(sv, this.hover ? ITM_PX_HOVER : ITM_PX).step(sv);
    // the outline's grey -> yellow rides the same tween as the px
    this.rp.su({
      px: this.px.value,
      hv: (ITM_PX - this.px.value) / (ITM_PX - ITM_PX_HOVER),
    });
    this.pin_title(sv);
    return this;
  }

  // the canvas fills the window, so ndc maps straight onto it
  pin_title(sv){
    this.el.classList.toggle('on', this.hover);
    const b = this.q.nb(sv);
    if(!b || !this.ln) return;
    const c = this.ln.to_screen({x: b.x - b.hw, y: b.y - b.hh});
    const x = (c.x + 1) * 0.5 * window.innerWidth;
    const y = (1 - c.y) * 0.5 * window.innerHeight;
    this.el.style.transform = `translate(${x}px, ${y}px)`;
  }
}

// the items in a column that scrolls forever. sized for VISIBLE of them on screen,
// the rest run off the top and bottom and wrap around out of sight
//
//   period = n * step, never shorter than the view plus an item past each edge,
//   so the wrap always happens off screen
//
//     - - - - - -  <- wraps here, y = +period / 2 (off screen)
//     |  itm 3  |     run off the top
//   ===============  view top
//     |  itm 0  |
//     |  itm 1  |
//   ===============  view bottom
//     |  itm 2  |     run off the bottom
//     - - - - - -  <- y = -period / 2
export class gllry_col {
  constructor(itms, {center = false} = {}){
    this.itms = itms;
    this.center = center;
    this.placed = false;
    this.itms.forEach(itm => { itm.col = this; });
    this.scroll = 0;
    this.target = 0;
    this.y = 0;
    this.top = 0;
    this.step_y = 0;
    this.period = 1;
    this.world_per_px = 0;
    this.dragged = false;
    this.live = true;
    this.touch_y = null;
    this.touch_from = 0;
  }

  get hover(){
    return this.itms.some(itm => itm.hover);
  }

  // x, y, z: the column's centre. step: slot height with VISIBLE on screen.
  // view_h: the gallery view's height in world units at z
  place(x, y, z, step, size, view_h, visible){
    const margin = size * 0.25;
    this.step_y = Math.max(step, (view_h + 2 * (size + margin)) / this.itms.length);
    this.period = this.step_y * this.itms.length;
    this.y = y;
    this.top = this.step_y * (visible - 1) * 0.5;
    this.world_per_px = view_h / window.innerHeight;
    this.itms.forEach(itm => itm.place(x, z, size, view_h + this.period));
    // center mode starts with the first item on the centre, not half a slot above it
    if(this.center && !this.placed){
      this.scroll = -this.top;
      this.target = -this.top;
    }
    this.placed = true;
    return this;
  }

  show(sv){
    this.itms.forEach((itm, i) => itm.show(sv, i));
    return this;
  }

  hide(sv){
    this.itms.forEach(itm => itm.hide(sv));
    return this;
  }

  // positive scrolls the items up, in screen px so a wheel moves them 1:1
  nudge(px){
    this.target += px * this.world_per_px;
    return this;
  }

  on_wheel(e){
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    this.nudge(e.deltaY * k);
  }

  on_touch_down(e){
    if(e.pointerType !== 'touch') return;
    this.touch_y = e.clientY;
    this.touch_from = e.clientY;
    this.dragged = false;
  }

  on_touch_move(e){
    if(this.touch_y === null || e.pointerType !== 'touch') return;
    this.nudge(this.touch_y - e.clientY);
    this.touch_y = e.clientY;
    if(Math.abs(e.clientY - this.touch_from) > DRAG_PX) this.dragged = true;
  }

  on_touch_up(e){
    this.touch_y = null;
    if(this.center) this.snap();
  }

  // the nearest scroll that puts an item's slot right on the column's centre
  snap(){
    this.target = Math.round((this.target + this.top) / this.step_y) * this.step_y - this.top;
    return this;
  }

  // the item whose slot is nearest the column's centre
  centred(){
    let best = 0;
    for(let i = 1; i < this.itms.length; i++){
      if(Math.abs(this.slot_y(i) - this.y) < Math.abs(this.slot_y(best) - this.y)) best = i;
    }
    return best;
  }

  // the slot's offset from the top one, wrapped into -period/2 .. period/2
  slot_y(i){
    const p = this.period;
    const rel = this.top - i * this.step_y + this.scroll;
    return this.y + ((((rel + p * 0.5) % p) + p) % p) - p * 0.5;
  }

  step(sv, f, live = true){
    this.live = live;
    this.scroll += (this.target - this.scroll) * SCROLL_EASE;
    const pick = this.center ? this.centred() : -1;
    this.itms.forEach((itm, i) => itm.step(sv, f, i, this.slot_y(i), live, this.center ? i === pick : null));
    return this;
  }
}
