export class ResizeStrategy {
    constructor(min_gap) { this.min_gap = min_gap; }
}
export class NeighborResize extends ResizeStrategy {
    apply(boundaries, index, target) {
        let last = boundaries.length - 1;
        let lo = index > 0 ? boundaries[index - 1] + this.min_gap : -Infinity;
        let hi = index < last ? boundaries[index + 1] - this.min_gap : Infinity;
        boundaries[index] = Math.max(lo, Math.min(hi, target));
    }
}
export class PushResize extends NeighborResize {
    _check_boundaries(boundaries, from, dir) {
        let to = from + dir;
        if (to < 0 || to >= boundaries.length)
            return false;
        return (boundaries[to] - boundaries[from]) * dir < this.min_gap - 1e-4;
    }
    _push_adjacent_boundaries(boundaries, index, dir) {
        if (!this._check_boundaries(boundaries, index, dir))
            return;
        let to = index + dir;
        boundaries[to] = boundaries[index] + dir * this.min_gap;
        this._push_adjacent_boundaries(boundaries, to, dir);
    }
    apply(boundaries, index, target) {
        let dir = Math.sign(target - boundaries[index]);
        super.apply(boundaries, index, target);
        boundaries[index] = target;
        if (dir !== 0)
            this._push_adjacent_boundaries(boundaries, index, dir);
    }
}
//# sourceMappingURL=stretch_bounds.js.map