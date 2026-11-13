// man ts/js sucks you can only have one constructor per class.
// that is so stupid.
export class tVec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    to_array() {
        return [this.x, this.y];
    }
    distance(other) {
        return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);
    }
}
export class Point {
    constructor(pos, type) {
        this.pos = pos;
        this.type = type;
    }
    is_type(type) {
        return this.type === type;
    }
    set(pos) {
        this.pos = pos;
    }
}
export class SVG {
    constructor() {
        this.points = [];
        this.segments = [];
        this.raw = '';
    }
    async load(url) {
        this.raw = await fetch(url).then(r => r.text());
        this.points = [];
        this.segments = [];
        const paths = this._extract_path_data(this.raw);
        for (let i = 0; i < paths.length; i++) {
            this._parse_path(paths[i], i);
        }
        return true;
    }
    _extract_path_data(svg_text) {
        const doc = new DOMParser().parseFromString(svg_text, 'image/svg+xml');
        return Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d') ?? '');
    }
    // self explanatory
    _add(x, y, type) {
        const p = new Point(new tVec2(x, y), type);
        this.points.push(p);
        return p;
    }
    to_path_d(path) {
        let out = '';
        for (const s of this.segments) {
            if (s.path !== path)
                continue;
            out += this._segment_str(s);
        }
        return out;
    }
    _segment_str(s) {
        const n = (p) => `${p.pos.x} ${p.pos.y}`;
        switch (s.cmd) {
            case 'Z': return 'Z';
            case 'M': return `M${n(s.pts[0])}`;
            case 'L': return `L${n(s.pts[0])}`;
            case 'T': return `T${n(s.pts[0])}`;
            case 'Q': return `Q${n(s.pts[0])} ${n(s.pts[1])}`;
            case 'S': return `S${n(s.pts[0])} ${n(s.pts[1])}`;
            case 'C': return `C${n(s.pts[0])} ${n(s.pts[1])} ${n(s.pts[2])}`;
            default: return '';
        }
    }
    _parse_path(d, path) {
        const tokens = d.match(/[MLHVZCSQTAmlhvzcsqta]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
        const is_cmd = (t) => /^[MLHVZCSQTAmlhvzcsqta]$/.test(t);
        let i = 0;
        let cmd = '';
        let cx = 0, cy = 0;
        let sx = 0, sy = 0;
        const num = () => parseFloat(tokens[i++]);
        const seg = (c, ...pts) => { this.segments.push({ cmd: c, pts, path }); };
        while (i < tokens.length) {
            if (is_cmd(tokens[i]))
                cmd = tokens[i++];
            const rel = cmd === cmd.toLowerCase();
            switch (cmd.toUpperCase()) {
                case 'M': {
                    let x = num(), y = num();
                    if (rel) {
                        x += cx;
                        y += cy;
                    }
                    seg('M', this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    sx = x;
                    sy = y;
                    cmd = rel ? 'l' : 'L'; // extra pairs after M are implicit lineto
                    break;
                }
                case 'L': {
                    let x = num(), y = num();
                    if (rel) {
                        x += cx;
                        y += cy;
                    }
                    seg('L', this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    break;
                }
                case 'H': {
                    let x = num();
                    if (rel)
                        x += cx;
                    seg('L', this._add(x, cy, 'anchor'));
                    cx = x;
                    break;
                }
                case 'V': {
                    let y = num();
                    if (rel)
                        y += cy;
                    seg('L', this._add(cx, y, 'anchor'));
                    cy = y;
                    break;
                }
                case 'C': {
                    let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
                    if (rel) {
                        x1 += cx;
                        y1 += cy;
                        x2 += cx;
                        y2 += cy;
                        x += cx;
                        y += cy;
                    }
                    seg('C', this._add(x1, y1, 'control'), this._add(x2, y2, 'control'), this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    break;
                }
                case 'S': {
                    let x2 = num(), y2 = num(), x = num(), y = num();
                    if (rel) {
                        x2 += cx;
                        y2 += cy;
                        x += cx;
                        y += cy;
                    }
                    seg('S', this._add(x2, y2, 'control'), this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    break;
                }
                case 'Q': {
                    let x1 = num(), y1 = num(), x = num(), y = num();
                    if (rel) {
                        x1 += cx;
                        y1 += cy;
                        x += cx;
                        y += cy;
                    }
                    seg('Q', this._add(x1, y1, 'control'), this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    break;
                }
                case 'T': {
                    let x = num(), y = num();
                    if (rel) {
                        x += cx;
                        y += cy;
                    }
                    seg('T', this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    break;
                }
                case 'A': {
                    num();
                    num();
                    num();
                    num();
                    num(); // rx ry x-rot large-arc sweep
                    let x = num(), y = num();
                    if (rel) {
                        x += cx;
                        y += cy;
                    }
                    seg('L', this._add(x, y, 'anchor'));
                    cx = x;
                    cy = y;
                    break;
                }
                case 'Z': {
                    seg('Z');
                    cx = sx;
                    cy = sy;
                    break;
                }
                default: {
                    i++; // unknown token, skip so we never spin
                    break;
                }
            }
        }
    }
}
//# sourceMappingURL=svg_parser.js.map