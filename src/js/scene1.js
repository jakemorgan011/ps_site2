import {sk, o, q, v, rc, ru, rm, rt, rx, rf, ir, b, s} from '../../engine/js/e.js';
import {euler, pivoted, surface_top} from './ground.js';
import {camera_move, tween} from './animations.js';
import {gllry_col, gllry_itm, gllry_rx} from './gllry.js';
import {lens} from './lens.js';
import {prints_wall} from './prints.js';
import {ENTRIES} from './entries.js';
import {info_card, view_of, viewport} from './viewport.js';

// every path draws into scene_t, in the order the arrows run. the fisheye
// reads scene_t once they're all done, then a fullscreen quad shows it.
//
//   ball       ball rc -> redux rf (16px) -> ball rx (blended, first, behind the building)
//                                                           v
//   building   light rf -> redux rf -> -------------------> bldng rm
//                                                           v
//   blob       ps3d ru -> redux rf -> blob rx (blended) -> spokes ru (blended,
//                                         |                 ^  tilted, depth off)
//   gallery                               +-> gllry rx[] ---+  (one per item, blended)
//                                                           v
//                                       scene_t -> fisheye rf -> final rx -> screen
//
// clicking a gallery item swings the camera round the scene (sv.yw) and pulls it far
// back, and an html viewport (viewport.js) slides in between it and the scene, standing
// on hangout's crop island. info swings it the other way, to a text card over hangout's
// other platform with ps_site2's face cube wandering it. fw() quads are screen locked, so
// the composites above don't turn with it

const er = document.getElementById('e');

const CLEAR = {r: 0, g: 0, b: 0, a: 0};
const LIGHT_RES = 2048;
// the fisheye's k. lens.js mirrors it for hit tests and html over the canvas
const FISHEYE_STRENGTH = 0.52;

const BUILDING_START_DIST = -5.0;
const BUILDING_END_DIST = 1.0;

// the ps3d quad decides where the blob lands on screen, but the building's depth
// buffer is tested against the fullscreen blob_q. both take BLOB_Z, and BLOB_X/Y
// are the screen spot (the doorway) back-projected to that depth, so moving z
// slides the blob in and out of the building without it drifting on screen.
// the doorway spot is where it sits with the building facing the camera, which
// is its rest pose now
const BLOB_BASE_Z = -4.0;
// how far the blob plane sits behind the doorway depth it was tuned at. the picture
// is scaled about the start camera by BLOB_K, so it stays put on screen
const BLOB_PUSH = 0.25;
const BLOB_Z = BLOB_BASE_Z - BLOB_PUSH;
const BLOB_X = -3.02;
const BLOB_Y = -0.48;
// the picture's offset from where BLOB_X/Y put it, in world units. x is where
// blob_q used to sit against the start camera; y is the building's bob, added per
// frame in draw(). it's applied to the ps3d quad, so the picture is rendered where
// it ends up and blob_q only has to fill the view
const BLOB_SHIFT_X = 0.8 - 1.5;

// hangout's test_ball, a sphere about 1.3 in radius, blown up into the ground
// under the building. it's centered under the building and re-seated every frame:
// its radius runs 1.26 to 1.34, so scaled up its surface under the building moves
// about 2.7 units as it spins, and a fixed radius either buried the building or
// left a gap. see ground.js
const BALL_SCALE = 28;
// 0 = the ball's surface just touches the building's base. positive buries the base
// that deep, negative leaves that much gap
const BALL_SINK = -0.4;
// the surface is measured at the mesh's points, so the real surface between them
// can sit a hair higher. this covers it
const BALL_CLEARANCE = 0.05;
const BALL_FOOT_MARGIN = 0.5;
// the ball renders alone and gets its own redux, in texels
const BALL_PIXEL = 8;
// how far past the building's back face the ball's composite quad sits. the mouse
// turn swings the corners out, so keep some room
const BALL_PLANE_MARGIN = 1.0;
// radians per frame, hangout's x / y / z spin ratio
const BALL_SPIN = 0.0004;
const BALL_SPIN_RATIO = {x: 1.5, y: 0.1, z: 1.2};
// the fake shadow: an ellipse on the ground, offset from the building's
// footprint centre, world units
const SHADOW_OFFSET = {x: 1.0, z: 1.2};
const SHADOW_RADIUS = {x: 2.2, z: 1.5};

// tall screens get their own arrangement: a camera pulled back and centred to fit
// the narrow view, a smaller spokes form tucked low, and everything below re-fit to
// the width. reloads if the window crosses between the two (see the end of the file)
const PORTRAIT_QUERY = '(max-aspect-ratio: 1/1)';
const PORTRAIT = window.matchMedia(PORTRAIT_QUERY).matches;
// phones: tall, or nothing to hover with. the gallery picks its centre item instead of
// the hovered one, a hint sits over the spokes, and the building leans toward them.
// style.css's mobile block uses the same query
const MOBILE_QUERY = `${PORTRAIT_QUERY}, (hover: none)`;
const MOBILE = window.matchMedia(MOBILE_QUERY).matches;
// radians about y off its camera facing pose. negative turns its front to screen right,
// toward the spokes (transform.wgsl's rotateY is column major)
const BLDNG_MOBILE_TURN = -0.35;
// on phones the spokes don't follow taps either: uMouse is held here. (0, 0) leaves the
// fill square at rest and the spokes' softness (fluid, off uMouse.x) exactly halfway
const SPOKES_MOBILE_MOUSE = new v(0, 0);
// the mobile hint's bottom edge, above the spokes' centre, in spokes sizes
const HINT_ABOVE = 0.85;

// the desktop start camera. the blob's tuning and final_q's distance still key off it
const CAMERA_START = {x: 1.5, y: 0, z: 7};
const HOME = PORTRAIT ? {x: -0.5, y: 0.3, z: 13} : CAMERA_START;
// the camera waits this high while loading, so the scene (hidden until it's ready)
// floats up into view from below when the camera drops to HOME
const CAMERA_INTRO_Y = PORTRAIT ? 18 : 10;
const BLOB_K = (CAMERA_START.z - BLOB_Z) / (CAMERA_START.z - BLOB_BASE_Z);

// a screen spot tuned at BLOB_BASE_Z, moved to BLOB_Z along the line from the start camera
function blob_spot(x, y){
  return {
    x: CAMERA_START.x + (x - CAMERA_START.x) * BLOB_K,
    y: CAMERA_START.y + (y - CAMERA_START.y) * BLOB_K,
  };
}

// shortest the loading screen stays up, so a fast load doesn't flash it
const LOADING_MIN_MS = 2200;
// frames the finished scene draws out of sight before the reveal, so pipelines,
// uploads and bind groups are all built before anything has to be smooth
const WARM_FRAMES = 20;
// loading spokes: the form's diameter as a fraction of the viewport height, and
// the px gap between the h1 and the spokes. the form reaches about 80% of its quad
const LOADING_SPOKES_VIEW = 0.55;
const LOADING_SPOKES_GAP_PX = 8;
// tall screens: the form's diameter as a fraction of the width
const LOADING_SPOKES_WIDTH = 0.62;
const LOADING_SPOKES_FILL = 0.8;
// how long the click-to-building move takes, seconds
const CAMERA_MOVE_SECONDS = 2.5;
// where the camera stops in front of the building's centre, world units
// tall screens go nearly into the building, so it crops to a piece of the facade
const CAMERA_STOP_DIST = PORTRAIT ? 0.8 : 1.6;

// tall screens: huge, in the top right of the home view, bleeding off the corner
const SPOKES_X = PORTRAIT ? HOME.x + 1.7 : 4;
const SPOKES_Y = PORTRAIT ? HOME.y + 3.6 : 0;
const SPOKES_Z = 4;
const SPOKES_SIZE = PORTRAIT ? 3.5 : 2.5;
// the gallery view sits this far in front of the spokes, far enough to frame the whole quad
const GALLERY_DIST = 2.2 * SPOKES_SIZE;
// radians. x leans the top away from the camera, y turns the right edge away
const SPOKES_TILT_X = 0.00;
const SPOKES_TILT_Y = 0.45;

// the gallery items: a column right of the spokes, its centre this far from theirs
const GLLRY_COL_X = 1.3 * SPOKES_SIZE;
// the column's on screen height and how many items it fits. the rest run off the
// edges, and it scrolls forever
const GLLRY_COL_H = 1.6 * SPOKES_SIZE;
const GLLRY_VISIBLE = 2;
// an item's half size at most, and how much of its slot it fills. the rest is the
// gap under it, which the hover title sits in
const GLLRY_ITM_SIZE = 0.35 * SPOKES_SIZE;
const GLLRY_ITM_FILL = 0.8;
// clicking an item orbits the camera round the spokes (the gallery's centre): swung
// VIEW_POSE.yaw round them (negative swings it out to the left), pulled out to .zoom
// times the gallery distance so the scene sits far off in the background, then turned
// .look further left so the scene lands right of centre, and tipped down .pitch so the
// island's top reads (0 = level). the viewport hangs VIEW_DIST in front of where the
// camera ends up
const VIEW_POSE = {yaw: -70 * Math.PI / 180, look: 0.4, pitch: 0.35, zoom: 5};
const VIEW_SECONDS = 1.8;
// info is the same orbit mirrored: swung right round the spokes and out, turned right
// so the scene lands left of centre. the card hangs INFO_DIST in front, INFO_RAISE up
const INFO_POSE = {yaw: 70 * Math.PI / 180, look: -0.4, pitch: 0.35, zoom: 5};
const INFO_DIST = 4.5;
const INFO_RAISE = 0.55;
const VIEW_DIST = 4.5;
// the viewport's centre sits this far up the screen from the view's centre, world
// units at VIEW_DIST, which leaves room for the island under it
const VIEW_RAISE = 0.45;

// hangout's crop island (farm_platform.obj, split into its grass and farmland slabs),
// right under the iframe panel, centred on its bottom edge. ISLAND_FIT is its width as
// a share of the panel's, over 1 so it reads as a base the panel stands on. its top
// sits ISLAND_GAP under the panel and it turns ISLAND_SPIN radians a frame. own target
// + redux, like the ball
const ISLAND_FIT = 1.2;
const ISLAND_GAP = 0.0;
const ISLAND_SPIN = 0.003;
const ISLAND_PIXEL = 8;
// where it waits while no viewport is up, well out of every view
const ISLAND_PARK_Y = -1000;
const PARK = {x: 0, y: ISLAND_PARK_Y, z: 0};

// hangout's hangout_test platform under the info card, split by material like the crop
// island (same bounds, so one scale + position). PLATFORM_FIT of the card's width, its
// top PLATFORM_GAP under the card. it shares the island's target, so it gets the same
// redux, at PLATFORM_PIXEL while it's up so the face on the cube still reads
const PLATFORM_PARTS = ['carpet.jpg', 'things.jpg', 'wood.jpg', 'fence.png'];
// tall screens: the card is nearly the screen's width, so the platform stays under it
const PLATFORM_FIT = PORTRAIT ? 0.75 : 1.3;
const PLATFORM_GAP = 0.25;
const PLATFORM_SPIN = 0.002;
const PLATFORM_PIXEL = 4;
// ps_site2's face cube, wandering the platform's big carpet in the platform's own
// (obj) units. the carpet runs x -0.5..0.98, z -0.35..0.93; the wander keeps the cube's
// half diagonal inside it. FACE_FLOOR is the wood plank's top, the highest thing it
// crosses, so it hovers a touch over the carpet and bobs
const FACE_EDGE = 0.4;
const FACE_FLOOR = 0.192;
const FACE_CENTRE = {x: 0.24, z: 0.29};
const FACE_REACH = {x: 0.39, z: 0.29};
const FACE_WANDER = 0.006;
const FACE_BOB = 0.04;
// radians per frame on every axis, ps_site2's frameCount * 0.01
const FACE_SPIN = 0.01;

function frames(n){
  return new Promise(done => {
    const tick = () => (--n > 0 ? requestAnimationFrame(tick) : done());
    requestAnimationFrame(tick);
  });
}

function engine(path){
  return new URL(`../../engine/${path}`, import.meta.url);
}

function local(path){
  return new URL(`../wgsl/${path}`, import.meta.url);
}

function asset(path){
  return new URL(`../../assets/${path}`, import.meta.url);
}

function make_itm(entry){
  return new gllry_itm(new gllry_rx(asset(`gllry/${entry.img}`)), entry);
}

// depth 'always' so the building, which fills the camera, can't hide it
class overlay extends ru {
  ds(){
    return {format: s.df, depthWriteEnabled: false, depthCompare: 'always'};
  }
}

class draw extends sk {
  cam(){
    return new v(HOME.x, CAMERA_INTRO_Y, HOME.z);
  }

  fail(x){
    console.error(x);
    if(er) er.textContent = String(x && x.message ? x.message : x);
  }

  async setup(sv){
    const scene_t = sv.tg(0, 0);
    this.warm = false;
    this.revealed = false;
    this.held = new Map();
    this.brand = document.querySelector('.brand');

    this.build_motion();
    await this.build_spokes(sv, scene_t);
    await this.build_output(sv);
    this.load_scene(sv, scene_t).catch(x => this.fail(x));
  }

  // the heavy passes are built but held back from the graph until everything has
  // loaded, so nothing of the scene draws while it loads. then they join the graph
  // and warm up with the camera still high, where none of the scene is in view
  async load_scene(sv, scene_t){
    const floor = new Promise(done => setTimeout(done, LOADING_MIN_MS));
    await this.build_building(sv, scene_t);
    await this.build_ball(sv, scene_t);
    await this.build_blob(sv, scene_t);
    this.blob_out.ac(this.spokes);
    await this.build_gllry(sv, scene_t);
    await this.build_island(sv, scene_t);
    await this.build_info();
    this.wire_input(sv);
    this.held.forEach((pass, key) => sv.am(key, pass));
    this.warm = true;
    await Promise.all([floor, frames(WARM_FRAMES)]);
    this.reveal(sv);
    this.vp.preload(ENTRIES.filter(e => e.view?.preload).map(e => view_of(e)));
  }

  hold(key, pass){
    if(!pass.sv) pass.sv = this.sv;
    this.held.set(key, pass);
    return pass;
  }

  reveal(sv){
    this.revealed = true;
    document.body.classList.remove('loading');
    this.cam_move.go(sv, 'start', HOME);
    this.spokes_x.go(sv, SPOKES_X);
    this.spokes_y.go(sv, SPOKES_Y);
    this.spokes_s.go(sv, SPOKES_SIZE);
    this.tilt_y.go(sv, SPOKES_TILT_Y);
  }

  build_motion(){
    const start = {x: HOME.x, y: CAMERA_INTRO_Y, z: HOME.z};
    this.cam_move = new camera_move(start, CAMERA_MOVE_SECONDS);
    this.spokes_x = new tween(0, CAMERA_MOVE_SECONDS);
    this.spokes_y = new tween(0, CAMERA_MOVE_SECONDS);
    this.spokes_s = new tween(0, CAMERA_MOVE_SECONDS);
    this.tilt_y = new tween(0, CAMERA_MOVE_SECONDS);
    this.view_w = new tween(0, VIEW_SECONDS);
    this.info_w = new tween(0, VIEW_SECONDS);
    this.island_at = null;
    this.platform_at = null;
    this.island_px = ISLAND_PIXEL;
    this.viewing = null;
    this.info_on = false;
  }

  // parks the spokes right of the h1 while loading. the quad is placed in world
  // space at SPOKES_Z so it lands on the screen spot the h1 is at
  place_loading_spokes(sv){
    const h1 = this.brand.getBoundingClientRect();
    const cv = this.c.getBoundingClientRect();
    const hh = (sv.a.z - SPOKES_Z) * Math.tan(sv.fv / 2);
    const hw = hh * sv.w / sv.h;
    const world_per_px = 2 * hh / cv.height;
    const diameter = PORTRAIT ? LOADING_SPOKES_WIDTH * cv.width : LOADING_SPOKES_VIEW * cv.height;
    const half_px = diameter * 0.5 / LOADING_SPOKES_FILL;
    // wide: right of the h1. tall: stacked above it
    const cx = PORTRAIT
      ? cv.left + cv.width * 0.5
      : h1.right + LOADING_SPOKES_GAP_PX + half_px * LOADING_SPOKES_FILL;
    const cy = PORTRAIT
      ? h1.top - LOADING_SPOKES_GAP_PX - half_px * LOADING_SPOKES_FILL
      : h1.top + h1.height * 0.5;
    this.spokes_x.set(sv.a.x + ((cx - cv.left) / cv.width * 2 - 1) * hw);
    this.spokes_y.set(sv.a.y + (1 - (cy - cv.top) / cv.height * 2) * hh);
    this.spokes_s.set(half_px * world_per_px);
    this.tilt_y.set(0);
  }

  wire_input(sv){
    this.bldng.oc = () => this.live() && this.go_bldng(sv);
    this.gllry.itms.forEach(itm => { itm.oc = () => this.go_view(sv, itm); });
    this.vp.on_close = () => this.close_view(sv);
    this.prints = new prints_wall(document.querySelector('.prints'), document.querySelector('.print_big'));
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => this.on_nav(btn.dataset.view, sv));
    });
    window.addEventListener('keydown', e => e.key === 'Escape' && this.on_escape(sv));
    this.c.addEventListener('wheel', e => this.in_gllry() && this.gllry.on_wheel(e), {passive: true});
    this.c.addEventListener('pointerdown', e => this.gllry.on_touch_down(e));
    this.c.addEventListener('pointermove', e => this.in_gllry() && this.gllry.on_touch_move(e));
    this.c.addEventListener('pointerup', e => this.gllry.on_touch_up(e));
    this.c.addEventListener('pointercancel', e => this.gllry.on_touch_up(e));
  }

  // facing the scene with no viewport or info open, so the canvas takes hovers and clicks
  live(){
    return !this.viewing && !this.info_on && this.view_w.value < 1e-3 && this.info_w.value < 1e-3;
  }

  in_gllry(){
    return this.cam_move.heading('gllry') && this.live();
  }

  // while a viewport is up, any nav spins back to the gallery first (prints and info
  // go straight on). leaving info for anything else swings back from it
  on_nav(view, sv){
    if(this.viewing){
      this.close_view(sv);
      if(view !== 'bldng' && view !== 'info') return;
    }
    if(view !== 'info') this.close_info(sv);
    if(view === 'bldng') this.go_bldng(sv);
    if(view === 'gllry') this.go_gllry(sv);
    if(view === 'return') this.go_home(sv);
    if(view === 'info') this.go_info(sv);
  }

  on_escape(sv){
    if(this.viewing) return this.close_view(sv);
    if(this.info_on){
      this.close_info(sv);
      this.go_home(sv);
    }
  }

  // distance at which half_w world units fill the view's width, never closer than
  // base. only matters on a tall screen, where the width is the tight side. the
  // gallery uses it so the whole spokes form fits
  fit_dist(sv, half_w, base){
    const need = half_w / (Math.tan(sv.fv / 2) * sv.w / sv.h);
    return Math.max(base, need);
  }

  go_bldng(sv){
    this.hide_gllry(sv);
    this.tilt_y.go(sv, SPOKES_TILT_Y);
    this.cam_move.go(sv, 'bldng', new v(
      this.bldng.t.x,
      this.bldng.t.y,
      this.bldng.t.z + CAMERA_STOP_DIST,
    ));
  }

  go_home(sv){
    this.hide_gllry(sv);
    this.tilt_y.go(sv, SPOKES_TILT_Y);
    this.cam_move.go(sv, 'start', HOME);
  }

  // the camera can't turn, so it squares up to the spokes by sitting in front of
  // them and the quad's tilt eases out to flat. the items float down beside them
  go_gllry(sv){
    this.tilt_y.go(sv, 0);
    this.cam_move.go(sv, 'gllry', new v(SPOKES_X, SPOKES_Y, SPOKES_Z + this.gllry_dist(sv)));
    this.place_gllry(sv);
    this.gllry.show(sv);
  }

  hide_gllry(sv){
    this.gllry?.hide(sv);
  }

  // the gallery camera orbited round the spokes. w = 0 is the gallery pose, 1 is swung
  // pose.yaw round them, tipped pose.pitch and pose.zoom times as far, then turned
  // pose.look off them. it sits back along -forward of the pose that looks straight at
  // the spokes, forward = (-sin a cos pt, -sin pt, -cos a cos pt)
  orbit(sv, w, pose){
    const a = w * pose.yaw;
    const pt = w * pose.pitch;
    const d = this.gllry_dist(sv) * (1 + (pose.zoom - 1) * w);
    return {
      x: SPOKES_X + d * Math.sin(a) * Math.cos(pt),
      y: SPOKES_Y + d * Math.sin(pt),
      z: SPOKES_Z + d * Math.cos(a) * Math.cos(pt),
      yw: a + w * pose.look,
      pt,
    };
  }

  // eases the camera from wherever cam_move has it onto each orbit, by that orbit's w,
  // so leaving mid way (or going straight from a viewport to info) still blends smoothly.
  // at w = 0 an orbit adds no turn, so the two turns just sum
  step_view(sv){
    const wv = this.view_w.step(sv).value;
    const wi = this.info_w.step(sv).value;
    const ov = this.orbit(sv, wv, VIEW_POSE);
    const oi = this.orbit(sv, wi, INFO_POSE);
    sv.yw = ov.yw + oi.yw;
    sv.pt = ov.pt + oi.pt;
    for(const [o, w] of [[ov, wv], [oi, wi]]){
      if(w <= 0) continue;
      sv.a = new v(
        sv.a.x + (o.x - sv.a.x) * w,
        sv.a.y + (o.y - sv.a.y) * w,
        sv.a.z + (o.z - sv.a.z) * w,
      );
    }
  }

  // world point dist in front of an orbit end pose and raise up its screen
  ahead(end, dist, raise){
    const sy = Math.sin(end.yw), cy = Math.cos(end.yw);
    const sp = Math.sin(end.pt), cp = Math.cos(end.pt);
    return {
      x: end.x - sy * cp * dist - sy * sp * raise,
      y: end.y - sp * dist + cp * raise,
      z: end.z - cy * cp * dist - cy * sp * raise,
    };
  }

  // the viewport waits in front of the orbit's end pose and slides in as the camera swings
  go_view(sv, itm){
    if(!this.in_gllry()) return;
    this.viewing = itm;
    const src = view_of(itm.entry, asset(`gllry/${itm.entry.img}`).href);
    const end = this.orbit(sv, 1, VIEW_POSE);
    this.vp.open(src, itm.entry, this.ahead(end, VIEW_DIST, VIEW_RAISE), VIEW_DIST, {yw: end.yw, pt: end.pt});
    this.seat_island(sv);
    this.view_w.go(sv, 1);
  }

  // sized off the panel, its top face just under the panel's bottom edge
  seat_island(sv){
    const ft = this.vp.foot(sv);
    b(this.island_grass, ISLAND_FIT * this.vp.panel.offsetWidth / this.vp.scale(sv));
    this.island_farm.ss(this.island_grass.sc);
    const half_h = this.island_grass.ex().y * 0.5 * this.island_grass.sc;
    this.island_at = {x: ft.x, y: ft.y - ISLAND_GAP - half_h, z: ft.z};
  }

  // parked out of view unless a viewport is up or on its way, otherwise seated and turning
  step_island(f){
    const on = (this.viewing || this.view_w.value > 1e-3) && this.island_at;
    const at = on ? this.island_at : PARK;
    for(const slab of [this.island_grass, this.island_farm]){
      slab.st(at.x, at.y, at.z).sr(0, f * ISLAND_SPIN, 0);
    }
  }

  close_view(sv){
    if(!this.viewing) return;
    this.viewing = null;
    this.vp.close();
    this.view_w.go(sv, 0);
  }

  // swings right and out (the viewport's orbit mirrored) to the info card. the
  // camera's base heads home underneath, so closing info lands there
  go_info(sv){
    if(this.info_on) return;
    this.info_on = true;
    this.hide_gllry(sv);
    this.tilt_y.go(sv, SPOKES_TILT_Y);
    this.cam_move.go(sv, 'info', HOME);
    const end = this.orbit(sv, 1, INFO_POSE);
    this.info.hang(this.ahead(end, INFO_DIST, INFO_RAISE), INFO_DIST, {yw: end.yw, pt: end.pt});
    this.seat_platform(sv);
    this.info_w.go(sv, 1);
  }

  close_info(sv){
    if(!this.info_on) return;
    this.info_on = false;
    this.info.close();
    this.info_w.go(sv, 0);
  }

  // sized off the card, the top of its bounds just under the card's bottom edge
  seat_platform(sv){
    const ft = this.info.foot(sv);
    const lead = this.platform[0];
    b(lead, PLATFORM_FIT * this.info.card.offsetWidth / this.info.scale(sv));
    this.platform.forEach(part => part.ss(lead.sc));
    const half_h = lead.ex().y * 0.5 * lead.sc;
    this.platform_at = {x: ft.x, y: ft.y - PLATFORM_GAP - half_h, z: ft.z};
  }

  // the platform turns about y. the cube's wander is in the platform's obj units, so
  // it goes through the same pivot + scale + turn (transform.wgsl's xf) to land on it
  step_platform(f){
    const on = (this.info_on || this.info_w.value > 1e-3) && this.platform_at;
    const at = on ? this.platform_at : PARK;
    const turn = f * PLATFORM_SPIN;
    this.platform.forEach(part => part.st(at.x, at.y, at.z).sr(0, turn, 0));

    const lead = this.platform[0];
    const t = f * FACE_WANDER;
    const lx = FACE_CENTRE.x + FACE_REACH.x * Math.sin(t) * Math.cos(t * 0.37);
    const lz = FACE_CENTRE.z + FACE_REACH.z * Math.sin(t * 0.71 + 1.3);
    const ly = FACE_FLOOR + FACE_EDGE * 0.5 * Math.sqrt(3) + FACE_BOB * Math.abs(Math.sin(t * 9));
    const px = (lx + lead.lo.x) * lead.sc;
    const py = (ly + lead.lo.y) * lead.sc;
    const pz = (lz + lead.lo.z) * lead.sc;
    const c = Math.cos(turn), sn = Math.sin(turn);
    b(this.face, FACE_EDGE * lead.sc);
    this.face
      .st(at.x + c * px - sn * pz, at.y + py, at.z + sn * px + c * pz)
      .sr(f * FACE_SPIN, f * FACE_SPIN, f * FACE_SPIN);

    const px_now = this.info_on ? PLATFORM_PIXEL : ISLAND_PIXEL;
    if(px_now !== this.island_px){
      this.island_px = px_now;
      this.island_redux.su({px: px_now, ps: 0});
    }
  }

  // far enough back to frame the spokes and the column of items right of them
  gllry_dist(sv){
    return this.fit_dist(sv, GLLRY_COL_X + GLLRY_ITM_SIZE * 1.1, GALLERY_DIST);
  }

  // mobile only: 'scroll to see more' just over the spokes while the gallery is up.
  // projected like rn.nb(), then through the fisheye, like the item titles
  place_hint(sv){
    const on = MOBILE && this.in_gllry() && this.gllry.itms.some(itm => itm.shown);
    this.hint.classList.toggle('on', on);
    if(!on) return;
    const d = sv.a.z - SPOKES_Z;
    const f = 1 / Math.tan(sv.fv / 2);
    const ndc = this.lens.to_screen({
      x: (SPOKES_X - sv.a.x) * f / (sv.w / sv.h) / d,
      y: (SPOKES_Y + SPOKES_SIZE * HINT_ABOVE - sv.a.y) * f / d,
    });
    const x = (ndc.x + 1) * 0.5 * window.innerWidth;
    const y = (1 - ndc.y) * 0.5 * window.innerHeight;
    this.hint.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }

  // GLLRY_VISIBLE slots over GLLRY_COL_H, centred on the spokes. items wait over
  // the top of the gallery view, so they float down into it
  place_gllry(sv){
    const step = GLLRY_COL_H / GLLRY_VISIBLE;
    const size = Math.min(GLLRY_ITM_SIZE, step * 0.5 * GLLRY_ITM_FILL);
    const view_h = 2 * this.gllry_dist(sv) * Math.tan(sv.fv / 2);
    this.gllry.place(SPOKES_X + GLLRY_COL_X, SPOKES_Y, SPOKES_Z, step, size, view_h, GLLRY_VISIBLE);
  }

  async build_building(sv, scene_t){
    this.bldng = b(await o.l(engine('assets/building.obj')), 1.0);
    ir.g().dg(this.bldng);
    this.bldng.st(-4.0, 0, 0.5+BUILDING_START_DIST).ss(1.54);

    this.bldng_pass = this.hold('bldng', new rm().vx('vsmh').tt(scene_t));
    await this.bldng_pass.s(local('building.wgsl'));

    this.light = this.hold('light', new rf(this.bldng.mt).tt(sv.tg(LIGHT_RES, LIGHT_RES)));
    await this.light.s(engine('wgsl/shaders/light.wgsl'));

    this.redux = this.hold('redux', new rf(this.light).tt(sv.tg(LIGHT_RES, LIGHT_RES)));
    await this.redux.s(engine('wgsl/shaders/redux.wgsl'));

    this.redux.ac(this.bldng_pass);
    this.bldng_pass.ao('bldng', this.bldng, this.redux.ot);
  }

  async build_ball(sv, scene_t){
    this.ball = await o.l(asset('test_ball.obj'), false, false);
    ir.g().dg(this.ball);
    this.ball.ss(BALL_SCALE);

    this.ball_points = pivoted(this.ball.ob.v, this.ball.lo);
    this.ball_base = this.bldng.t.y - this.bldng.ex().y * 0.5 * this.bldng.sc;
    // half the footprint's diagonal, so it holds at any turn of the building,
    // plus a margin so a lump just outside it is counted too
    this.ball_foot = 0.5 * Math.hypot(this.bldng.ex().x, this.bldng.ex().z) * this.bldng.sc + BALL_FOOT_MARGIN;
    this.seat_ball();

    this.ball_pass = this.hold('ball', new rc().tt(sv.tg(0, 0, CLEAR)));
    await this.ball_pass.s(local('ball.wgsl'));
    this.ball_pass.ao('ball', this.ball);
    this.ball_pass.su({shadow: [
      this.bldng.t.x + SHADOW_OFFSET.x,
      this.bldng.t.z + SHADOW_OFFSET.z,
      SHADOW_RADIUS.x,
      SHADOW_RADIUS.z,
    ]});

    this.ball_redux = this.hold('ball_redux', this.ball_pass.ac(new rf().tt(sv.tg(0, 0, CLEAR))));
    await this.ball_redux.s(engine('wgsl/shaders/redux.wgsl'));
    this.ball_redux.su({px: BALL_PIXEL, ps: 0});

    // the ball now lives in its own target, so it has no depth in scene_t. this
    // quad stands in for it, and it's behind the building twice over: it draws
    // first, and it sits past the building's back face, so the building wins
    // whichever one gets reordered later. blended, so only the ball's own pixels land
    const back = this.bldng.t.z - this.bldng.ex().z * 0.5 * this.bldng.sc;
    this.ball_out = new rx(this.ball_redux).sb().tt(scene_t);
    this.ball_q = this.ball_out.ao('qb', new q().st(0, 0, back - BALL_PLANE_MARGIN));
    this.ball_out.ac(this.bldng_pass);
  }

  // under the building, with its surface at the building's base whatever the ball's turn
  seat_ball(){
    const top = surface_top(this.ball_points, euler(this.ball.rt), BALL_SCALE, this.ball_foot);
    this.ball.st(this.bldng.t.x, this.ball_base - top + BALL_SINK - BALL_CLEARANCE, this.bldng.t.z);
  }

  async build_blob(sv, scene_t){
    const blob = this.hold('ps3d', new ru().tt(sv.tg(0, 0, CLEAR)));
    await blob.s(engine('wgsl/shaders/ps3d.wgsl'));
    this.blob_pic = blob.ao('qd', new q().ss(0.9 * BLOB_K).st(BLOB_X, BLOB_Y, BLOB_Z));

    this.blob_redux = this.hold('ps3d_redux', blob.ac(new rf().tt(sv.tg(0, 0, CLEAR))));
    await this.blob_redux.s(engine('wgsl/shaders/redux.wgsl'));

    this.blob_out = new rx(this.blob_redux).sb().tt(scene_t);
    this.blob_q = this.blob_out.ao('qds', new q().st(0, 0, BLOB_Z));
    this.bldng_pass.ac(this.blob_out);
    this.ball_out.ac(this.blob_out);
  }

  // one render parent per entries.js row, each between the blob and the spokes.
  // add a row there to add an item. clicking one spins round to its viewport
  async build_gllry(sv, scene_t){
    this.lens = new lens(FISHEYE_STRENGTH);
    this.vp = new viewport(this.c);
    this.gllry = new gllry_col(ENTRIES.map(make_itm), {center: MOBILE});
    this.hint = document.querySelector('.hint');
    for(const [i, itm] of this.gllry.itms.entries()){
      const rp = this.hold(`gllry_${i}`, itm.rp.sb().fi('cv').tt(scene_t));
      await itm.load(local('gllry.wgsl'), this.lens);
      this.blob_out.ac(rp);
      rp.ac(this.spokes);
    }
    this.place_gllry(sv);
  }

  // same shape as the ball's path: drawn alone, redux'd, then composited into scene_t
  // through a screen locked quad. the two slabs share bounds (see the obj headers),
  // so one scale and one position put them back together
  async build_island(sv, scene_t){
    this.island_grass = await o.l(asset('crop_island/grass.obj'), false, false);
    this.island_farm = await o.l(asset('crop_island/farm.obj'), false, false);
    ir.g().dg(this.island_grass);
    ir.g().dg(this.island_farm);
    this.step_island(0);

    this.island_pass = this.hold('island', new rt().tt(sv.tg(0, 0, CLEAR)));
    await this.island_pass.s(local('island.wgsl'));
    this.island_pass.ao('grass', this.island_grass, asset('crop_island/grass.jpg'));
    this.island_pass.ao('farm', this.island_farm, asset('crop_island/farmland.jpg'));

    this.island_redux = this.hold('island_redux', this.island_pass.ac(new rf().tt(sv.tg(0, 0, CLEAR))));
    await this.island_redux.s(engine('wgsl/shaders/redux.wgsl'));
    this.island_redux.su({px: ISLAND_PIXEL, ps: 0});

    // gllry_rx is just an rx with depth 'always', which a composite wants too. it's
    // nearer than anything, so it goes in last, after the spokes, right before the fisheye
    this.island_out = new gllry_rx(this.island_redux).sb().tt(scene_t);
    this.island_q = this.island_out.ao('qi', new q());
    this.spokes.ac(this.island_out);
    this.island_out.ac(this.fisheye);
  }

  // the info view: index.html's section.info in a card, hangout's other platform and
  // the face cube under it. they render in the island's pass, so no new targets
  async build_info(){
    this.info = new info_card(this.c, document.querySelector('.info'));
    this.platform = [];
    for(const tex of PLATFORM_PARTS){
      const name = tex.split('.')[0];
      const part = await o.l(asset(`hangout_platform/${name}.obj`), false, false);
      ir.g().dg(part);
      this.island_pass.ao(`platform_${name}`, part, asset(`hangout_platform/${tex}`));
      this.platform.push(part);
    }
    this.face = await o.l(asset('face_cube/cube.obj'), false, false);
    ir.g().dg(this.face);
    this.island_pass.ao('face', this.face, asset('face_cube/me.jpg'));
    this.step_platform(0);
  }

  async build_spokes(sv, scene_t){
    this.spokes = sv.am('spokes', new overlay().sb().tt(scene_t));
    await this.spokes.s(local('spokes.wgsl'));
    this.spokes_q = this.spokes.ao('qd', new q(false)
      .st(SPOKES_X, SPOKES_Y, SPOKES_Z)
      .ss(SPOKES_SIZE)
      .sr(SPOKES_TILT_X, SPOKES_TILT_Y, 0));
  }

  async build_output(sv){
    this.fisheye = sv.am('fisheye', new rf());
    await this.fisheye.s(local('fisheye.wgsl'));
    this.spokes.ac(this.fisheye);

    const final = new rx(this.fisheye);
    this.final_q = final.ao('final', new q().st(0, 0, 0));
  }

  draw(t, sv){
    const f = s.fn();
    if(!this.revealed) this.place_loading_spokes(sv);
    this.cam_move.step(sv);
    this.step_view(sv);
    this.spokes_x.step(sv);
    this.spokes_y.step(sv);
    this.spokes_s.step(sv);
    this.tilt_y.step(sv);
    this.spokes_q
      .st(this.spokes_x.value, this.spokes_y.value, SPOKES_Z)
      .ss(this.spokes_s.value)
      .sr(SPOKES_TILT_X, this.tilt_y.value, 0);
    // final_q only fills the view, so it trails the camera at the start distance
    this.final_q.st(0, 0, sv.a.z - CAMERA_START.z);
    this.final_q.fw(sv);
    this.fisheye.su({strength: FISHEYE_STRENGTH});
    this.spokes.su({uMouse: MOBILE ? SPOKES_MOBILE_MOUSE : sv.ms});
    if(!this.warm) return;

    this.gllry.step(sv, f, this.live());
    this.place_hint(sv);
    // the prints float in once the camera is all the way into the building
    document.body.classList.toggle('in_shop', this.cam_move.arrived('bldng') && this.live());
    this.vp.place(sv, this.viewing !== null && this.view_w.value >= 1);
    this.info.place(sv, this.info_on && this.info_w.value >= 1);
    this.step_island(f);
    this.step_platform(f);
    this.island_q.st(0, 0, sv.a.z - 1).fw(sv);
    const over_bldng = this.live() && !this.cam_move.heading('bldng') && this.bldng.ib(sv);
    this.c.classList.toggle('clickable', this.gllry.hover || over_bldng);
    this.blob_q.fw(sv);
    this.ball_q.fw(sv);
    this.bldng.sr(0, MOBILE ? BLDNG_MOBILE_TURN : 0, 0);
    this.ball.sr(f * BALL_SPIN * BALL_SPIN_RATIO.x, f * BALL_SPIN * BALL_SPIN_RATIO.y, f * BALL_SPIN * BALL_SPIN_RATIO.z);
    this.seat_ball();

    this.drive_building(f);
    this.drive_blob(f);
    this.bldng.st(-4.0, 0+1-((Math.sin(f * 0.01) + 0.25) * 0.25), 0.5+BUILDING_START_DIST)
    const bob = 1-((Math.sin(f * 0.01) + 0.25) * 0.25);
    const pic = blob_spot(BLOB_X + BLOB_SHIFT_X, BLOB_Y + bob);
    this.blob_pic.st(pic.x, pic.y, BLOB_Z);
    this.blob_q.st(sv.a.x, sv.a.y, BLOB_Z);
    
  }

  drive_building(f){
    this.bldng_pass.su({
      str: {x: 0, y: 0},
      origin: {x: 0, y: 0},
    });
    this.light.su({
      lightpos: {
        x: Math.sin(f * 0.011) * 0.8,
        y: Math.cos(f * 0.013) * 0.6,
        z: 0.5 + Math.sin(f * 0.007) * 0.2,
      },
      rgb: {
        r: 0.75 + Math.sin(f * 0.009) * 0.25,
        g: 0.75 + Math.sin(f * 0.009 + 2.1) * 0.25,
        b: 0.75 + Math.sin(f * 0.009 + 4.2) * 0.25,
      },
      intensity: 1.5 + Math.sin(f * 0.017) * 0.6,
    });
    this.redux.su({
      px: 2 + Math.sin(f * 0.001) * 2,
      ps: 10 - Math.sin(f * 0.015) * 8,
    });
  }

  drive_blob(f){
    this.blob_redux.su({
      px: 12 + Math.sin(f * 0.02) * 4,
      ps: 60,
    });
  }
}

new draw('m').run();

window.matchMedia(PORTRAIT_QUERY).addEventListener('change', () => window.location.reload());
