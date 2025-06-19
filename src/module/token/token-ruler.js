
/**
 * A Starfinder-specific implementation of the token ruler
 * Implementation is heavily based off of and reuses code from the Draw Steel system (June 2025)
 * https://github.com/MetaMorphic-Digital/draw-steel
 *
 */

export default class SFRPGTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
    /**
     * Helper function called in `init` hook
     * @internal
     */
    static applySFRPGMovementConfig() {
        foundry.utils.mergeObject(CONFIG.Token.movement.actions, {
            burrow: {
                canSelect: (token) => {
                    if (CONFIG.SFRPG.actorsCharacterScale.includes(token.actor.type)) {
                        return !(token instanceof TokenDocument) || token.actor.system.attributes.speed.burrowing?.value;
                    } else if (token.actor.type === "starship") {
                        return !(token instanceof TokenDocument);
                    } else {
                        return true;
                    }
                }
            },
            climb: {
                canSelect: (token) => {
                    if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    if (token.actor.system.attributes.speed.climbing?.value) return cost => cost;
                    else return cost => cost * 2;
                }
            },
            crawl: {
                canSelect: (token) => {
                    if (token.actor.type !== "starship") {
                        return (token instanceof TokenDocument) && token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    return cost => cost;
                }
            },
            fly: {
                canSelect: (token) => {
                    if (CONFIG.SFRPG.actorsCharacterScale.includes(token.actor.type)) {
                        return !(token instanceof TokenDocument) || (!token.hasStatusEffect("prone") && token.actor.system.attributes.speed.flying?.value);
                    } else if (token.actor.type === "starship") {
                        return !(token instanceof TokenDocument) || token.actor.system.attributes.speed.value;
                    } else {
                        return true;
                    }
                }
            },
            jump: {
                canSelect: (token) => {
                    if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    return cost => cost;
                }
            },
            swim: {
                canSelect: (token) => {
                    if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    if (token.actor.system.attributes.speed.swimming?.value) return cost => cost;
                    else return cost => cost * 2;
                }
            },
            walk: {
                canSelect: (token) => {
                    if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                }
            }
        }, { performDeletions: true });
    }

    /**
     * @inheritdoc
     * @param {DeepReadonly<TokenRulerWaypoint>} waypoint
     */
    _getSegmentStyle(waypoint) {
        const style = super._getSegmentStyle(waypoint);
        this.#speedValueStyle(style, waypoint);
        return style;
    }

    /**
     * @inheritdoc
     * @param {DeepReadonly<Omit<TokenRulerWaypoint, "index"|"center"|"size"|"ray">>} waypoint
     * @param {DeepReadonly<foundry.grid.types.GridOffset3D>} offset
     */
    _getGridHighlightStyle(waypoint, offset) {
        const style = super._getGridHighlightStyle(waypoint, offset);
        this.#speedValueStyle(style, waypoint);
        return style;
    }

    /* -------------------------------------------------- */

    /**
     * Adjusts the grid or segment style based on the token's movement characteristics
     * @param {{ color?: PIXI.ColorSource }} style        - The calculated style properties from the parent class
     * @param {DeepReadonly<TokenRulerWaypoint>} waypoint - The waypoint being adjusted
     * @protected
     */
    #speedValueStyle(style, waypoint) {
        // color order
        const colors = [0x33BC4E, 0xF1D836, 0xE72124];

        // Calculate the movement available based on the movement type used
        const movementOptionsInverted = Object.fromEntries(
            Object.entries(CONFIG.SFRPG.movementOptions).map(entry => entry.reverse())
        );
        const activeMovementType = movementOptionsInverted[waypoint.action];
        let value = 0;
        switch (waypoint.action) {
            case "crawl":
                value = 5;
                break;
            case "jump":
                value = this.token.actor.system.attributes.speed.land?.value;
                break;
            default:
                if (this.token.actor.type === "starship") {
                    value = this.token.actor.system.attributes.speed.value;
                } else {
                    value = this.token.actor.system.attributes.speed[activeMovementType]?.value ?? Infinity;
                }
                break;
        }

        // Total cost, up to 1x is green, up to 2x is yellow, over that is red
        const index = Math.clamp(Math.floor((waypoint.measurement.cost - 1) / value), 0, 2);
        style.color = colors[index];
    }
}
