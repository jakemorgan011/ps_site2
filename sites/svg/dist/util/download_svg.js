// serializes the live <svg> (grid dividers stripped) and hands it to the browser
// as a file download. the paths already carry their morphed `d` values, so this
// just cleans + saves whatever is on screen.
//
// pass `box` to re-fit the file to the current (possibly resized) bounds -- the
// grid can be grown past the original viewBox, so the saved viewBox + size follow
// it. `scale` keeps the file's pixel size in step with the on-screen scale.
export function download_svg(svg, filename, box, scale = 1) {
    let clone = svg.cloneNode(true);
    clone.querySelectorAll('.grid-line').forEach(el => el.remove());
    if (box) {
        clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
        clone.setAttribute('width', String(box.w * scale));
        clone.setAttribute('height', String(box.h * scale));
    }
    let text = new XMLSerializer().serializeToString(clone);
    let blob = new Blob([text], { type: 'image/svg+xml' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=download_svg.js.map