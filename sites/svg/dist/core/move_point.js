import { tVec2 } from '../util/svg_parser.js';
// free-form deformation: bind every point to its home cell once, then as the
// grid's cells move/resize, apply() drops each point back at the same normalized
// spot in its cell. the artwork morphs with the grid.
//
// points live in svg user space; the grid is 0-relative, so we shift by `origin`
// (the viewBox min) going in and back out.
export class PointWarp {
    constructor(points, grid, origin) {
        this.m_homes = [];
        this.m_origin = origin;
        for (const pt of points) {
            let gx = pt.pos.x - origin.x;
            let gy = pt.pos.y - origin.y;
            let cell = grid.cell_index_at(gx, gy);
            let c = grid.m_sub_bounds[cell];
            this.m_homes.push({
                pt,
                cell,
                u: c.box.width ? (gx - c.pos.x) / c.box.width : 0,
                v: c.box.height ? (gy - c.pos.y) / c.box.height : 0
            });
        }
    }
    apply(grid) {
        for (const h of this.m_homes) {
            let c = grid.m_sub_bounds[h.cell];
            let gx = c.pos.x + h.u * c.box.width;
            let gy = c.pos.y + h.v * c.box.height;
            h.pt.set(new tVec2(gx + this.m_origin.x, gy + this.m_origin.y));
        }
    }
}
//# sourceMappingURL=move_point.js.map