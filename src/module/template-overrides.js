import { measureDistance } from "./canvas.js";
import { degtorad } from "./utils/utilities.js";

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

// Applies patches to core functions to integrate Starfinder specific measurements.
export class TemplateLayerSFRPG extends TemplateLayer {
    async _onDragLeftStart(event) {
        if (canvas.grid.type !== CONST.GRID_TYPES.SQUARE) return super._onDragLeftStart(event);

        // Call placeables layer super instead of templatelayer
        const origin = duplicate(event.interactionData.origin);
        await PlaceablesLayer.prototype._onDragLeftStart.call(this, event);

        // Create the new preview template
        const tool = game.activeTool;
        const { originalEvent } = event;

        // Snap to grid
        if (!originalEvent.shiftKey) {
            const pos = canvas.grid.getSnappedPosition(origin.x, origin.y, this.gridPrecision);
            origin.x = pos.x;
            origin.y = pos.y;
        }

        // Create the template
        const data = {
            user: game.user.id,
            t: tool,
            x: origin.x,
            y: origin.y,
            distance: 1,
            direction: 0,
            fillColor: game.user.color || "#FF0000",
            hidden: event.altKey
        };

        // Apply some type-specific defaults
        const defaults = CONFIG.MeasuredTemplate.defaults;
        if (tool === "cone") data["angle"] = defaults.angle;
        else if (tool === "ray") data["width"] = defaults.width * canvas.dimensions.distance;

        // Create a preview template
        const doc = new CONFIG.MeasuredTemplate.documentClass(data, { parent: canvas.scene });
        const template = new CONFIG.MeasuredTemplate.objectClass(doc);
        event.interactionData.preview = this.preview.addChild(template);
        return template.draw();
    }

    _onDragLeftMove(event) {
        if (canvas.grid.type !== CONST.GRID_TYPES.SQUARE) return super._onDragLeftMove(event);

        const { destination, layerDragState, preview, origin } = event.interactionData;
        if (layerDragState === 0) return;

        const { originalEvent } = event;

        // Snap the destination to the grid
        const snapToGrid = !originalEvent.shiftKey;
        if (snapToGrid) {
            event.interactionData.destination = canvas.grid.getSnappedPosition(destination.x, destination.y, this.gridPrecision);
        }

        // Compute the ray
        const ray = new Ray(origin, destination);
        const dist = canvas.dimensions.distance;
        const ratio = canvas.dimensions.distancePixels;

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
            preview.document.distance = Math.floor(baseDistance / dist) * dist;
        } else {
            preview.document.distance = baseDistance;
        }
        preview.renderFlags.set({refreshShape: true});

        // Confirm the creation state
        event.interactionData.layerDragState = 2;
    }
}

export class MeasuredTemplateSFRPG extends MeasuredTemplate {
    getHighlightedSquares() {

        const grid = canvas.grid,
            gridSizePx = canvas.dimensions.size, // Size of each cell in pixels
            gridSizeUnits = canvas.dimensions.distance; // feet, meters, etc.

        const templateType = this.document.t,
            templateDirection = this.document.direction,
            templateAngle = this.document.angle;

        // Parse rays as per Bresenham's algorithm
        if (templateType === "ray") {
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
        }

        // Get number of rows and columns
        const nr = Math.ceil((this.document.distance * 1.5) / gridSizeUnits / (gridSizePx / grid.h)),
            nc = Math.ceil((this.document.distance * 1.5) / gridSizeUnits / (gridSizePx / grid.w));

        // Get the center of the grid position occupied by the template
        const { x, y } = this.document;

        const [cx, cy] = grid.getCenter(x, y),
            [col0, row0] = grid.grid.getGridPositionFromPixels(cx, cy),
            minAngle = Math.normalizeDegrees(templateDirection - templateAngle / 2),
            maxAngle = Math.normalizeDegrees(templateDirection + templateAngle / 2);

        const originOffset = { x: 0, y: 0 };
        // Offset measurement for cones
        if (templateType === "cone") {
            // Degrees anticlockwise from pointing right. In 45-degree increments from 0 to 360
            const dir = (templateDirection >= 0 ? 360 - templateDirection : -templateDirection) % 360;
            // If we're not on a border for X, offset by 0.5 or -0.5 to the border of the cell in the direction we're looking on X axis
            const xOffset = this.document.x % gridSizePx !== 0
                ? Math.sign((1 * Math.round(Math.cos(degtorad(dir)) * 100)) / 100) / 2 // /2 turns from 1/0/-1 to 0.5/0/-0.5
                : 0;
            // Same for Y, but cos Y goes down on screens, we invert
            const yOffset = this.document.y % gridSizePx !== 0 ? -Math.sign((1 * Math.round(Math.sin(degtorad(dir)) * 100)) / 100) / 2 : 0;
            originOffset.x = xOffset;
            originOffset.y = yOffset;
        }

        const result = [];
        for (let a = -nc; a < nc; a++) {
            for (let b = -nr; b < nr; b++) {
                // Position of cell's top-left corner, in pixels
                const [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(col0 + a, row0 + b);
                // Position of cell's center, in pixels
                const [cellCenterX, cellCenterY] = [gx + gridSizePx * 0.5, gy + gridSizePx * 0.5];

                // Determine point of origin
                const origin = {
                    x: this.document.x + originOffset.x * gridSizePx,
                    y: this.document.y + originOffset.y * gridSizePx
                };

                // Determine point we're measuring the distance to - always in the center of a grid square
                const destination = { x: cellCenterX, y: cellCenterY };

                if (templateType === "cone") {
                    const ray = new Ray(origin, destination);
                    const rayAngle = Math.normalizeDegrees(ray.angle / (Math.PI / 180));
                    if (ray.distance > 0 && !withinAngle(minAngle, maxAngle, rayAngle)) {
                        continue;
                    }
                }

                const distance = measureDistance(destination, origin);
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

        const highlightSquares = this.getHighlightedSquares();

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

    // Highlight grid in SF style
    highlightGrid() {
        if (!["circle", "cone", "ray"].includes(this.document.t) || canvas.grid.type !== CONST.GRID_TYPES.SQUARE) {
            return super.highlightGrid();
        }

        const grid = canvas.grid;
        const { borderColor, fillColor } = this;

        // Clear existing highlight
        const hl = this.getHighlightLayer();
        hl.clear();
        if (!this.isVisible) return;

        const positions = this.getHighlightedSquares();
        for (const {x, y} of positions) {
            grid.grid.highlightGridPosition(hl, {x, y, border: borderColor, color: fillColor});
        }

    }

    getHighlightLayer() {
        return canvas.grid.getHighlightLayer(this.highlightId);
    }
}
