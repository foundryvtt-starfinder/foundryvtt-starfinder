import { MeasuredTemplateSFRPG } from "./template-overrides.js";
/**
 * A helper class for building MeasuredTemplates for SF spells and abilities
 *
 * @augments MeasuredTemplateSFRPG
 */
export default class AbilityTemplate extends MeasuredTemplateSFRPG {
    /**
   * A factory method to create an AbilityTemplate instance using provided data
   *
   * @param {string} type                The type of template ("cone", "circle", "rect" or "ray")
   * @param {number} distance            The distance/size of the template
   * @param {string} color               An optional color for the template to use
   * @param {string} texture             An texture color for the template to use
   * @returns {AbilityTemplate|null}     The template object, or null if the data does not produce a template
   */
    static fromData({type, distance, color, texture}) {
        if (!type) return null;
        if (!["cone", "circle", "rect", "ray"].includes(type)) return null;

        if (!distance) return null;
        if (!canvas.scene) return null;

        // Prepare template data
        const data = {
            t: type,
            user: game.user.id,
            distance: distance || 5,
            direction: 0,
            x: 0,
            y: 0,
            fillColor: color ?? game.user.color,
            texture: texture ?? null,
            _id: randomID(16)
        };

        // Apply some type-specific defaults
        const defaults = CONFIG.MeasuredTemplate.defaults;
        switch (type) {
            case "cone": {
                data.angle = defaults.angle;
                break;
            }
            case "rect": {
                data.distance = Math.sqrt(Math.pow(distance, 2) + Math.pow(distance, 2));
                data.direction = 45;
                break;
            }
            case "ray": {
                data.width = defaults.width * canvas.dimensions.distance;
                break;
            }
        }

        // Return the template constructed from the item data
        const cls = CONFIG.MeasuredTemplate.documentClass;
        const template = new cls(data, { parent: canvas.scene });
        const object = new this(template);
        return object;
    }

    /* -------------------------------------------- */

    /**
   * Creates a preview of the spell template
   *
   * @param {Event} event   The initiating click event
   */
    async drawPreview(event) {
        const initialLayer = canvas.activeLayer;
        await this.draw();
        this.active = true;
        this.layer.activate();
        this.layer.preview.addChild(this);
        return this.activatePreviewListeners(initialLayer);
    }

    /* -------------------------------------------- */

    /**
   * Activate listeners for the template preview
   *
   * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
   * @returns {Promise<boolean>} Returns true if placed, or false if cancelled
   */
    activatePreviewListeners(initialLayer) {
        return new Promise((resolve) => {
            const handlers = {};
            let moveTime = 0;

            const _clear = () => {
                if (this.destroyed) return;
                this.destroy();
            };

            // Update placement (mouse-move)
            handlers.mouseMove = (event) => {
                event.stopPropagation();
                const now = Date.now(); // Apply a 20ms throttle
                if (now - moveTime <= 20) return;
                const center = event.data.getLocalPosition(this.layer);
                const pos = canvas.grid.getSnappedPosition(center.x, center.y, 2);
                this.document.x = pos.x;
                this.document.y = pos.y;
                this.refresh();
                canvas.app.render();
                moveTime = now;
            };

            // Cancel the workflow (right-click)
            handlers.rightClick = (event, canResolve = true) => {
                this.layer.preview.removeChildren();
                canvas.stage.off("mousemove", handlers.mouseMove);
                canvas.stage.off("mousedown", handlers.leftClick);
                canvas.app.view.oncontextmenu = null;
                canvas.app.view.onwheel = null;
                // Clear highlight
                this.active = false;
                const hl = canvas.grid.getHighlightLayer(this.highlightId);
                hl.clear();
                _clear();

                initialLayer.activate();
                if (canResolve)
                    resolve({
                        result: false
                    });
            };

            // Confirm the workflow (left-click)
            handlers.leftClick = async (event) => {
                handlers.rightClick(event, false);

                // Create the template
                const result = {
                    result: true,
                    place: async () => {
                        const doc = (
                            await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject(false)])
                        )[0];
                        this.document = doc;
                        return doc;
                    },
                    delete: () => {
                        return this.document.delete();
                    }
                };
                _clear();
                resolve(result);
            };

            // Rotate the template by 3 degree increments (mouse-wheel)
            handlers.mouseWheel = (event) => {
                if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
                event.stopPropagation();
                let delta, snap;
                if (event.ctrlKey) {
                    if (this.document.t === "rect") {
                        delta = Math.sqrt(canvas.dimensions.distance * canvas.dimensions.distance);
                    } else {
                        delta = canvas.dimensions.distance;
                    }
                    this.document.distance += delta * -Math.sign(event.deltaY);
                } else {
                    if (this.document.t === "cone") {
                        delta = 90;
                        snap = event.shiftKey ? delta : 45;
                    } else {
                        delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
                        snap = event.shiftKey ? delta : 5;
                    }
                    if (this.document.t === "rect") {
                        snap = Math.sqrt(Math.pow(5, 2) + Math.pow(5, 2));
                        this.document.distance += snap * -Math.sign(event.deltaY);
                    } else {
                        this.document.direction += snap * Math.sign(event.deltaY);
                    }
                }
                this.refresh();
            };

            // Activate listeners
            if (this.controlIcon) this.controlIcon.removeAllListeners();
            canvas.stage.on("mousemove", handlers.mouseMove);
            canvas.stage.on("mousedown", handlers.leftClick);
            canvas.app.view.oncontextmenu = handlers.rightClick;
            canvas.app.view.onwheel = handlers.mouseWheel;
            this.hitArea = new PIXI.Polygon([]);
        });
    }

    refresh() {
        if (!this.template) return;
        if (!canvas.scene) return;

        return super.refresh();
    }
}

