import { Bounds } from './bounds.js';
export function find_largest_bounds(points) {
    let out = new Bounds();
    let gx = 0; // greatest x
    let gy = 0; // greatest y
    for (let i = 0; i < points.length; i++) {
        let cx = points[i].pos.x;
        let cy = points[i].pos.y;
        if (cx > gx) {
            gx = cx;
        }
        ;
        if (cy > gy) {
            gy = cy;
        }
        ;
    }
    out.set_bounds(gx, gy);
    return out;
}
export function assign_to_bounds(points, bounds) {
    let cell_width = bounds.width / bounds.m_col_div;
    let cell_height = bounds.height / bounds.m_row_div;
    // one group per cell, same order as m_sub_bounds.
    // groups[k].cell IS bounds.m_sub_bounds[k] (same object, not a copy) so the
    // geometry has a single source of truth -- only point membership lives here.
    let groups = [];
    for (let i = 0; i < bounds.m_sub_bounds.length; i++) {
        groups.push({ cell: bounds.m_sub_bounds[i], points: [] });
    }
    // uniform grid -> owning cell is just the floored position, O(1) per point.
    // edge points (x == width) and anything out of range clamp into the last cell.
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let col = Math.floor(p.pos.x / cell_width);
        let row = Math.floor(p.pos.y / cell_height);
        col = Math.max(0, Math.min(bounds.m_col_div - 1, col));
        row = Math.max(0, Math.min(bounds.m_row_div - 1, row));
        groups[row * bounds.m_col_div + col].points.push(p);
    }
    return groups;
}
//# sourceMappingURL=divide_path.js.map