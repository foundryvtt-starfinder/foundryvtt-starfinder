import { degtorad } from "./utilities.js";

// Borrows quite heavily from the Pathfinder 1e system by Furyspark.
export default function() {
    const _templateLayerOriginalOnDragLeftStart = TemplateLayer.prototype._onDragLeftStart;
    TemplateLayer.prototype._onDragLeftStart = function (event) {
        if (!game.settings.get("sfrpg", "useStarfinderAOETemplates")) return _templateLayerOriginalOnDragLeftStart.call(this, event);

        PlaceablesLayer.prototype._onDragLeftStart.call(this, event);

        const tool = game.activeTool;
        const origin = event.data.origin;
        let pos = canvas.grid.getSnappedPosition(origin.x, origin.y, 2);
        origin.x = pos.x;
        origin.y = pos.y;

        // Create the template
        const data = {
            user: game.user.id,
            t: tool,
            x: origin.x,
            y: origin.y,
            distance: 1,
            direction: 0,
            fillColor: game.user.data.color || "#FF0000"
        };

        if (tool === "cone") data["angle"] = 90;
        else if (tool === "ray") data["width"] = 5;

        const doc = new MeasuredTemplateDocument(data, {parent: canvas.scene});
        const template = new MeasuredTemplate(doc);
        event.data.preview = this.preview.addChild(template);
        template.draw();
    };

    const _templateLayerOriginalOnDragLeftMove = TemplateLayer.prototype._onDragLeftMove;
    TemplateLayer.prototype._onDragLeftMove = function (event) {
        if (!game.settings.get("sfrpg", "useStarfinderAOETemplates")) return _templateLayerOriginalOnDragLeftMove.call(this, event);

        PlaceablesLayer.prototype._onDragLeftMove.call(this, event);
        if (event.data.createState >= 1) {
            // Snap the destination to the grid
            let dest = event.data.destination;
            let { x, y } = canvas.grid.getSnappedPosition(dest.x, dest.y, 2);
            dest.x = x;
            dest.y = y;

            // Compute the ray
            let template = event.data.preview;
            let ray = new Ray(event.data.origin, event.data.destination);
            let ratio = canvas.dimensions.size / canvas.dimensions.distance;

            // Update the shape data
            if (["cone", "circle"].includes(template.data.t)) {
                const direction = ray.angle;
                template.data.direction = Math.toDegrees(Math.floor((direction + (Math.PI * 0.125)) / (Math.PI * 0.25)) * (Math.PI * 0.25));
                const distance = ray.distance / ratio;
                template.data.distance = Math.floor(distance / canvas.dimensions.distance) * canvas.dimensions.distance;
            } else {
                template.data.direction = Math.toDegrees(ray.angle);
                template.data.distance = ray.distance / ratio;
            }

            template.refresh();
            event.data.createState = 2;
        }
    };

    const _measuredTemplateOriginalHightlightGrid = MeasuredTemplate.prototype.highlightGrid;
    MeasuredTemplate.prototype.highlightGrid = function () {
        if (!game.settings.get("sfrpg", "useStarfinderAOETemplates") || !["circle", "cone"].includes(this.data.t)) return _measuredTemplateOriginalHightlightGrid.call(this);

        const grid = canvas.grid;
        const d = canvas.dimensions;
        const bc = this.borderColor;
        const fc = this.fillColor;

        // Only highlight for objects which have a defined shape
        if (!this.id || !this.shape) return;

        // Clear existing highlight
        const hl = grid.getHighlightLayer(this.highlightId);
        hl.clear();

        // Get number of rows and columns
        let nr = Math.ceil(((this.data.distance * 1.5) / d.distance) / (d.size / grid.h));
        let nc = Math.ceil(((this.data.distance * 1.5) / d.distance) / (d.size / grid.w));

        // Get the center of the grid position occupied by the template
        let x = this.data.x;
        let y = this.data.y;

        let [cx, cy] = grid.getCenter(x, y);
        let [col0, row0] = grid.grid.getGridPositionFromPixels(cx, cy);
        let minAngle = (360 + ((this.data.direction - this.data.angle * 0.5) % 360)) % 360;
        let maxAngle = (360 + ((this.data.direction + this.data.angle * 0.5) % 360)) % 360;

        const within_angle = function (min, max, value) {
            min = (360 + min % 360) % 360;
            max = (360 + max % 360) % 360;
            value = (360 + value % 360) % 360;

            if (min < max) return value >= min && value <= max;
            return value >= min || value <= max;
        };

        const measureDistance = function (p0, p1) {
            let gs = canvas.dimensions.size;
            let ray = new Ray(p0, p1);

            // How many squares do we travel across to get there? If 2.3, we should count that as 3 instead of 2; hence Math.ceil
            let nx = Math.ceil(Math.abs(ray.dx / gs));
            let ny = Math.ceil(Math.abs(ray.dy / gs));

            // Get the number of straight and diagonal move
            let nDiagonal = Math.min(nx, ny);
            let nStraight = Math.abs(ny - nx);

            // Diagonals in Starfinder pretty much count as 1.5 times a straight
            let distance = Math.floor(nDiagonal * 1.5 + nStraight);
            let distanceOnGrid = distance * canvas.dimensions.distance;
            return distanceOnGrid;
        };

        let originOffset = {x: 0, y: 0};
        // Offset measurment for cones
        // Offset is to ensure that cones only start measuring from cell borders
        if (this.data.t === "cone") {
            // Degrees anticlockwise from pointing right. In 45-degree increments from 0 to 360
            const dir = (this.data.direction >= 0 ? 360 - this.data.direction : -this.data.direction) % 360;

            // If we're not on a border for x, offset by 0.5 or -0.5 to the border of the cell in the direction we're looking on X axis
            let xOffset = this.data.x % d.size !== 0 ? Math.sign(1 * (Math.round(Math.cos(degtorad(dir)) * 100)) / 100) / 2 : 0; // turns 1/0/-1 to 0.5/0/-0.5
            // Same for Y, but cos Y goes down on screens, we invert
            let yOffset = this.data.y % d.size !== 0 ? -Math.sign(1 * (Math.round(Math.sin(degtorad(dir)) * 100)) / 100) / 2 : 0;

            originOffset.x = xOffset;
            originOffset.y = yOffset;
        }

        // Point we are measuring distances from
        let origin = {
            x: this.data.x + (originOffset.x * d.size),
            y: this.data.y + (originOffset.y * d.size)
        };

        for (let a = -nc; a < nc; a++) {
            for (let b = -nr; b < nr; b++) {
                // Position of cell's top-left corner, in pixels
                let [gx, gy] = canvas.grid.grid.getPixelsFromGridPosition(col0 + a, row0 + b);
                // Position of cell's center, in pixels
                let [cellCenterX, cellCenterY] = [gx + d.size * 0.5, gy + d.size * 0.5];

                // Determine point of origin
                let ray = new Ray(origin, {x: cellCenterX, y: cellCenterY});

                let rayAngle = (360 + (ray.angle / (Math.PI / 180)) % 360) % 360;
                if (this.data.t === "cone" && ray.distance > 0 && !within_angle(minAngle, maxAngle, rayAngle)) {
                    continue;
                }

                // Determine point we're measuring the distance to - always in the center of a grid square
                let destination = { x: cellCenterX, y: cellCenterY };

                let distance = measureDistance(destination, origin);
                if (distance <= this.data.distance) {
                    grid.grid.highlightGridPosition(hl, { x: gx, y: gy, color: fc, border: bc });
                }
            }
        }
    };
}
