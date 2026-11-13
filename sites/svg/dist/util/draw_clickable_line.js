import { tVec2 } from './svg_parser.js';
export class Line {
    constructor(axis, offset, length, index, from = 0) {
        this.axis = axis;
        this.offset = offset;
        this.length = length;
        this.index = index;
        this.from = from;
    }
    get_offset() { return this.offset; }
    set_offset(offset) { this.offset = offset; }
    start() {
        return this.axis === 'vertical'
            ? new tVec2(this.offset, this.from)
            : new tVec2(this.from, this.offset);
    }
    end() {
        return this.axis === 'vertical'
            ? new tVec2(this.offset, this.from + this.length)
            : new tVec2(this.from + this.length, this.offset);
    }
    hit_test(pos, threshold) {
        let lo = this.from, hi = this.from + this.length;
        if (this.axis === 'vertical') {
            return Math.abs(pos.x - this.offset) <= threshold && pos.y >= lo && pos.y <= hi;
        }
        return Math.abs(pos.y - this.offset) <= threshold && pos.x >= lo && pos.x <= hi;
    }
}
const SVG_NS = 'http://www.w3.org/2000/svg';
export function draw_line(target, line, origin) {
    let a = line.start();
    let b = line.end();
    let el = document.createElementNS(SVG_NS, 'line');
    el.setAttribute('x1', String(origin.x + a.x));
    el.setAttribute('y1', String(origin.y + a.y));
    el.setAttribute('x2', String(origin.x + b.x));
    el.setAttribute('y2', String(origin.y + b.y));
    el.setAttribute('class', 'grid-line');
    target.appendChild(el);
    return el;
}
export function redraw_grid(target, lines, origin) {
    target.querySelectorAll('.grid-line').forEach(el => el.remove());
    for (const line of lines)
        draw_line(target, line, origin);
}
//# sourceMappingURL=draw_clickable_line.js.map