
/**
 *  @import { TokenMovementActionConfig, TokenRulerWaypoint } from "@client/_types.mjs"
 *  @import { DeepReadonly } from "@common/_types.mjs"
 */
/**
 * A Starfinder-specific implementation of the token ruler
 * Implementation is heavily based off of and reuses code from the Draw Steel system (June 2025)
 * https://github.com/MetaMorphic-Digital/draw-steel
 */
export default class SFRPGTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
    /**
     * Helper function called in `init` hook to apply movement configuration specific to starfinder
     * @internal
     */
    static applySFRPGMovementConfig() {
        foundry.utils.mergeObject(CONFIG.Token.movement.actions, {
            /** @type {TokenMovementActionConfig} */
            burrow: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (CONFIG.SFRPG.actorsCharacterScale.includes(token.actor.type)) {
                        return !(token instanceof TokenDocument) || token.actor.system.attributes.speed.burrowing?.value;
                    } else if (token.actor.type === "starship") {
                        return !(token instanceof TokenDocument);
                    } else {
                        return true;
                    }
                }
            },
            /** @type {TokenMovementActionConfig} */
            climb: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    if (token.actor.system.attributes.speed.climbing?.value) return cost => cost;
                    else return cost => cost * 2;
                }
            },
            /** @type {TokenMovementActionConfig} */
            crawl: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (token.actor.type !== "starship") {
                        return (token instanceof TokenDocument) && token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    return cost => cost;
                }
            },
            /** @type {TokenMovementActionConfig} */
            fly: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (CONFIG.SFRPG.actorsCharacterScale.includes(token.actor.type)) {
                        return !(token instanceof TokenDocument) || (!token.hasStatusEffect("prone") && token.actor.system.attributes.speed.flying?.value);
                    } else if (token.actor.type === "starship") {
                        return !(token instanceof TokenDocument) || token.actor.system.attributes.speed.value;
                    } else {
                        return true;
                    }
                }
            },
            /** @type {TokenMovementActionConfig} */
            jump: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    return cost => cost;
                }
            },
            /** @type {TokenMovementActionConfig} */
            swim: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (token.actor.type !== "starship") {
                        return !(token instanceof TokenDocument) || !token.hasStatusEffect("prone");
                    }
                    return false;
                },
                getCostFunction: (token, _options) => {
                    if (token.actor.system.attributes.speed.swimming?.value) return cost => cost;
                    else return cost => cost * 2;
                }
            },
            /** @type {TokenMovementActionConfig} */
            walk: {
                canSelect: (token) => {
                    const hasActor = token?.actor ? true : false;
                    if (!hasActor) {
                        return false;
                    } else if (token.actor.type !== "starship") {
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
        const colors = [
            game.settings.get("sfrpg", "rulerColor0"),
            game.settings.get("sfrpg", "rulerColor1"),
            game.settings.get("sfrpg", "rulerColor2")
        ];

        // Calculate the movement available based on the movement type used
        const movementOptionsInverted = Object.fromEntries(
            Object.entries(CONFIG.SFRPG.movementOptions).map(entry => entry.reverse())
        );
        const activeMovementType = movementOptionsInverted[waypoint.action];
        let value = 0;
        const hasActor = this.token?.actor ? true : false;
        const actorSpeed = hasActor ? (this.token.actor.system.attributes.speed ?? null) : false;
        switch (waypoint.action) {
            case "crawl":
                value = hasActor ? 5 : Infinity;
                break;
            case "jump":
                value = hasActor ? actorSpeed.land?.value : Infinity;
                break;
            default:
                if (hasActor && this.token.actor.type === "starship") {
                    value = hasActor ? actorSpeed.value : Infinity;
                } else if (hasActor && actorSpeed) {
                    value = actorSpeed[activeMovementType]?.value ?? Infinity;
                } else {
                    value = Infinity;
                }
                break;
        }

        // Total cost, up to 1x is green, up to 2x is yellow, over that is red
        const index = Math.clamp(Math.floor((waypoint.measurement.cost - 1) / value), 0, 2);
        style.color = colors[index];
    }
}
