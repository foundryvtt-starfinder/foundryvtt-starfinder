/**
 * Override the default Grid measurement function to add additional distance for subsequent diagonal moves
 * See BaseGrid.measureDistance for more details.
 * 
 * @param {Object[]} segments The starting position
 * @param {Object} options The ending position
 * @returns {Number[]} An Array of distance measurmements for each segment
 */
export const measureDistances = function(segments, options={}) {
    if (!options.gridSpaces) return BaseGrid.prototype.measureDistance.call(this, segments, options);

    let nDiagonal = 0;
    const rule = this.parent.diagonalRule;
    const d = canvas.dimensions;
    
    return segments.map(s => {
        let r = s.ray;

        let nx = Math.abs(Math.ceil(r.dx / d.size));
        let ny = Math.abs(Math.ceil(r.dy / d.size));

        let nd = Math.min(nx, ny);
        let ns = Math.abs(ny - nx);
        nDiagonal += nd;

        if (rule === "5105") {
            let nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
            let spaces = (nd10 * 2) + (nd - nd10) + ns;
            return spaces * canvas.dimensions.distance;
        }

        else return (ns + nd) * canvas.scene.data.gridDistance;
    });
};

/**
 * Hijack Token health bar rendering to include temporary and temp-max health in the bar display
 * TODO: This should probably be replaced with a formal Token Class extension
 */
const _TokenGetBarAttribute = Token.prototype.getBarAttribute;
export const getBarAttribute = function (...args) {
    const data = _TokenGetBarAttribute.bind(this)(...args);
    if (data && data.attribute === "attributes.hp") {
        data.value += parseInt(data['temp'] || 0);
        data.max += parseInt(data['tempmax'] || 0);
    }

    return data;
}
