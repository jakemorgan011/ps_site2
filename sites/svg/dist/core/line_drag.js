import { tVec2 } from '../util/svg_parser.js';
export class LineDragger {
    constructor(svg, grid, origin, strategy, hit_threshold, on_resize) {
        this.m_handle = null;
        this._on_down = (ev) => {
            let handle = this._pick(this._to_grid(ev));
            if (!handle)
                return;
            this.m_handle = handle;
            window.addEventListener('mousemove', this._on_drag);
            window.addEventListener('mouseup', this._on_up);
            ev.preventDefault();
        };
        this._on_drag = (ev) => {
            if (!this.m_handle)
                return;
            this.m_grid.move_handle(this.m_handle, this._to_grid(ev), this.strategy);
            this.on_resize();
        };
        this._on_up = () => {
            this.m_handle = null;
            window.removeEventListener('mousemove', this._on_drag);
            window.removeEventListener('mouseup', this._on_up);
        };
        this._on_hover = (ev) => {
            if (this.m_handle)
                return;
            let handle = this._pick(this._to_grid(ev));
            this.m_svg.style.cursor = handle?.axis === 'vertical' ? 'col-resize'
                : handle?.axis === 'horizontal' ? 'row-resize' : 'default';
        };
        this.m_svg = svg;
        this.m_grid = grid;
        this.m_origin = origin;
        this.strategy = strategy;
        this.m_hit_threshold = hit_threshold;
        this.on_resize = on_resize;
        this.m_svg.addEventListener('mousedown', this._on_down);
        this.m_svg.addEventListener('mousemove', this._on_hover);
    }
    set_strategy(strategy) { this.strategy = strategy; }
    dispose() {
        this.m_svg.removeEventListener('mousedown', this._on_down);
        this.m_svg.removeEventListener('mousemove', this._on_hover);
    }
    _to_grid(ev) {
        let ctm = this.m_svg.getScreenCTM();
        if (!ctm)
            return new tVec2(0, 0);
        let p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
        return new tVec2(p.x - this.m_origin.x, p.y - this.m_origin.y);
    }
    _pick(pos) {
        for (const line of this.m_grid.m_lines) {
            if (line.hit_test(pos, this.m_hit_threshold)) {
                return line.handle ?? { kind: 'base', axis: line.axis, index: line.index, depth: 0 };
            }
        }
        return null;
    }
}
//# sourceMappingURL=line_drag.js.map