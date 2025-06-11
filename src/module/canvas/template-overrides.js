const { Ray } = foundry.canvas.geometry;

// Applies patches to core functions to integrate Starfinder specific measurements.
export class TemplateLayerSFRPG extends foundry.canvas.layers.TemplateLayer {
    _onDragLeftStart(event) {

        if ( !event.shiftKey ) {
            const interaction = event.interactionData;

            // Snap the origin to the grid as per the rules
            const M = CONST.GRID_SNAPPING_MODES;
            let mode = M.VERTEX;
            switch (game.activeTool) {
                case "circle": mode |= M.CENTER; break;
                case "ray": mode |= M.SIDE_MIDPOINT; break; // RAW lines come from corners, but that creates 10ft lines
            }
            interaction.origin = canvas.grid.getSnappedPoint(interaction.origin, { mode });
        }

        return super._onDragLeftStart(event);
    }

    _onDragLeftMove(event) {
        if (canvas.grid.type !== CONST.GRID_TYPES.SQUARE) return super._onDragLeftMove(event);

        const interaction = event.interactionData;

        // Snap the destination to the grid
        const snapToGrid = !event.shiftKey;
        if (snapToGrid) interaction.destination = this.getSnappedPoint(interaction.destination);

        const { destination, preview, origin } = interaction;

        // Compute the ray
        const ray = new Ray(origin, destination);
        const dist = canvas.dimensions.distance;
        const ratio = canvas.dimensions.size / canvas.dimensions.distance;

        // Update the preview object
        const type = preview.document.t;

        // Set direction
        const baseDirection = Math.normalizeDegrees(Math.toDegrees(ray.angle));
        if (snapToGrid && ["cone", "circle"].includes(type)) {
            const halfAngle = CONFIG.MeasuredTemplate.defaults.angle / 2;
            preview.document.direction = Math.floor((baseDirection + halfAngle / 2) / halfAngle) * halfAngle;
        } else if (snapToGrid && type === "ray") {
            preview.document.direction = Math.floor((baseDirection + dist / 2) / dist) * dist;
        } else {
            preview.document.direction = baseDirection;
        }

        // Set distance
        const baseDistance = ray.distance / ratio;
        if (snapToGrid && ["cone", "circle", "ray"].includes(type)) {
            const increment = Math.max(baseDistance, dist);
            preview.document.distance = Math.ceil(increment / dist) * dist;
        } else {
            preview.document.distance = baseDistance;
        }

        preview.renderFlags.set({refreshShape: true});
    }
}

export class MeasuredTemplateSFRPG extends foundry.canvas.placeables.MeasuredTemplate {
    /**
   * Get an array of points which define top-left grid spaces to highlight for square or hexagonal grids.
   * @returns {Point[]}
   * @protected
   */
    _getGridHighlightPositions() {
        // Only override circles and cones
        const templateType = this.document.t;
        if (["rect", "ray"].includes(templateType)) return super._getGridHighlightPositions();

        const grid = canvas.grid,
            gridSizePx = canvas.dimensions.size, // Size of each cell in pixels
            gridSizeUnits = canvas.dimensions.distance; // feet, meters, etc.

        const templateDirection = this.document.direction,
            templateAngle = this.document.angle;

        // Parse rays as per Bresenham's algorithm
        // FIXME: causes strange highlight behaviour on V12 for some reason? Deferring to core ray highlighting for now
        /* if (templateType === "ray") {
            const result = [];

            const line = (x0, y0, x1, y1) => {
                x0 = Math.floor(Math.floor(x0) / gridSizePx);
                x1 = Math.floor(Math.floor(x1) / gridSizePx);
                y0 = Math.floor(Math.floor(y0) / gridSizePx);
                y1 = Math.floor(Math.floor(y1) / gridSizePx);

                const dx = Math.abs(x1 - x0);
                const dy = Math.abs(y1 - y0);
                const sx = x0 < x1 ? 1 : -1;
                const sy = y0 < y1 ? 1 : -1;
                let err = dx - dy;

                while (!(x0 === x1 && y0 === y1)) {
                    result.push({ x: x0 * gridSizePx, y: y0 * gridSizePx });
                    const e2 = err << 1;
                    if (e2 > -dy) {
                        err -= dy;
                        x0 += sx;
                    }
                    if (e2 < dx) {
                        err += dx;
                        y0 += sy;
                    }
                }
            };

            // Extend ray by half a square for better highlight calculation
            const ray = Ray.fromAngle(this.ray.A.x, this.ray.A.y, this.ray.angle, this.ray.distance + gridSizePx / 2);

            // Get resulting squares
            line(ray.A.x, ray.A.y, ray.B.x, ray.B.y);

            return result;
        } */

        // Get number of rows and columns
        const nr = Math.ceil((this.document.distance * 1.5) / gridSizeUnits / (gridSizePx / grid.sizeY)),
            nc = Math.ceil((this.document.distance * 1.5) / gridSizeUnits / (gridSizePx / grid.sizeX));

        // Get the center of the grid position occupied by the template
        const { x, y } = this.document;

        const {x: cx, y: cy} = grid.getCenterPoint({x, y}),
            {i: col0, j: row0} = grid.getOffset({x: cx, y: cy}),
            minAngle = Math.normalizeDegrees(templateDirection - templateAngle / 2),
            maxAngle = Math.normalizeDegrees(templateDirection + templateAngle / 2);

        const originOffset = { x: 0, y: 0 };
        // Offset measurement for cones
        if (templateType === "cone") {
            // Degrees anticlockwise from pointing right. In 45-degree increments from 0 to 360
            const dir = (templateDirection >= 0 ? 360 - templateDirection : -templateDirection) % 360;
            // If we're not on a border for X, offset by 0.5 or -0.5 to the border of the cell in the direction we're looking on X axis
            const xOffset = this.document.x % gridSizePx !== 0
                ? Math.sign((1 * Math.round(Math.cos(Math.toRadians(dir)) * 100)) / 100) / 2 // /2 turns from 1/0/-1 to 0.5/0/-0.5
                : 0;
            // Same for Y, but cos Y goes down on screens, we invert
            const yOffset = this.document.y % gridSizePx !== 0 ? -Math.sign((1 * Math.round(Math.sin(Math.toRadians(dir)) * 100)) / 100) / 2 : 0;
            originOffset.x = xOffset;
            originOffset.y = yOffset;
        }

        const result = [];
        for (let a = -nc; a < nc; a++) {
            for (let b = -nr; b < nr; b++) {
                // Position of cell's top-left corner, in pixels
                const { x: gx, y: gy } = grid.getTopLeftPoint({i: col0 + a, j: row0 + b});
                // Position of cell's center, in pixels
                const halfSize = grid.size / 2;
                const cellCenterX = gx + halfSize;
                const cellCenterY = gy + halfSize;

                // Determine point of origin
                const origin = {
                    x: this.document.x + originOffset.x * gridSizePx,
                    y: this.document.y + originOffset.y * gridSizePx
                };

                // Determine point we're measuring the distance to - always in the center of a grid square
                const destination = { x: cellCenterX, y: cellCenterY };
                const ray = new Ray(origin, destination);

                if (templateType === "cone") {
                    const rayAngle = Math.normalizeDegrees(ray.angle / (Math.PI / 180));
                    if (ray.distance > 0 && !withinAngle(minAngle, maxAngle, rayAngle)) {
                        continue;
                    }
                }

                const distance = measureDistanceOnGrid(ray);
                if (distance <= this.document.distance) {
                    result.push({ x: gx, y: gy });
                }
            }
        }

        return result;
    }

    /**
   * Determine tokens residing within the template bounds, based on either grid highlight logic or token center.
   *
   * @public
   * @returns {Token[]} Tokens sufficiently within the template.
   */
    getTokensWithin() {
        const shape = this.document.t,
            dimensions = this.scene.dimensions,
            gridSizePx = dimensions.size,
            gridSizeUnits = dimensions.distance;

        const result = [];
        // Special handling for gridless
        if (canvas.grid.type === CONST.GRID_TYPES.GRIDLESS && ["circle", "cone", "rect"].includes(shape)) {
            for (const t of canvas.tokens.placeables) {
                switch (shape) {
                    case "circle": {
                        const ray = new Ray(this.center, t.center);
                        // Calculate ray length in relation to circle radius
                        const raySceneLength = (ray.distance / gridSizePx) * gridSizeUnits;
                        // Include this token if its center is within template radius
                        if (raySceneLength <= this.document.distance) result.push(t);
                        break;
                    }
                    case "cone": {
                        const templateDirection = this.document.direction;
                        const templateAngle = this.document.angle,
                            minAngle = Math.normalizeDegrees(templateDirection - templateAngle / 2),
                            maxAngle = Math.normalizeDegrees(templateDirection + templateAngle / 2);

                        const ray = new Ray(this.center, t.center);
                        const rayAngle = Math.normalizeDegrees(Math.toDegrees(ray.angle));

                        const rayWithinAngle = withinAngle(minAngle, maxAngle, rayAngle);
                        // Calculate ray length in relation to circle radius
                        const raySceneLength = (ray.distance / gridSizePx) * gridSizeUnits;
                        // Include token if its within template distance and within the cone's angle
                        if (rayWithinAngle && raySceneLength <= this.document.distance) result.push(t);
                        break;
                    }
                    case "rect": {
                        const rect = {
                            x: this.x,
                            y: this.y,
                            width: this.width,
                            height: this.width
                        };
                        if (withinRect(t.center, rect)) result.push(t);
                        break;
                    }
                }
            }
            return result;
        }

        const highlightSquares = this._getGridHighlightPositions();

        for (const s of highlightSquares) {
            for (const t of canvas.tokens.placeables) {
                if (result.includes(t)) continue;

                const tokenData = {
                    x: Math.round(t.document.x / gridSizePx),
                    y: Math.round(t.document.y / gridSizePx),
                    width: t.document.width,
                    height: t.document.height
                };
                const squareData = {
                    x: Math.round(s.x / gridSizePx),
                    y: Math.round(s.y / gridSizePx)
                };

                if (withinRect(squareData, tokenData)) result.push(t);
            }
        }

        return result;
    }

}

/**
 * Given the distance in each dimension, measure the distance in grid units. This is used to draw MeasuredTemplates according to SF rules, not for the Ruler.
 * @param {Ray} ray  A ray representing the line segment between two points
 */
function measureDistanceOnGrid(ray) {

    if (!canvas.dimensions) return NaN;

    const gs = canvas.dimensions.size,
        nx = Math.ceil(Math.abs(ray.dx / gs)),
        ny = Math.ceil(Math.abs(ray.dy / gs));

    // Get the number of straight and diagonal moves
    const nDiagonal = Math.min(nx, ny),
        nStraight = Math.abs(ny - nx);

    const nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nDiagonal) / 2);
    const cells = nd10 * 2 + (nDiagonal - nd10) + nStraight;

    return cells * canvas.dimensions.distance;
}

// Borrows quite heavily from the Pathfinder 1e system by Furyspark.
const withinAngle = (min, max, value) => {
    min = Math.normalizeDegrees(min);
    max = Math.normalizeDegrees(max);
    value = Math.normalizeDegrees(value);

    if (min < max) return value >= min && value <= max;
    return value >= min || value <= max;
};

const withinRect = (point, rect) => {
    return point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height;
};
