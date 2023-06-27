/**
 * A class to create dummy Active Effects used to display icons on tokens
 */
export class TokenEffect {
    #effect;

    tint = null;

    isTemporary = true;

    constructor(effect) {
        this.#effect = effect;
    }

    get parent() {
        return this.#effect.parent;
    }

    get name() {
        return this.#effect.name;
    }

    get icon() {
        return this.#effect.img;
    }

    get description() {
        return this.#effect.system.description.value;
    }

    get flags() {
        return this.#effect.flags;
    }

    get statuses() {
        return new Set([this.#effect.name.slugify({replacement: "-", strict: true})]);
    }

    get disabled() {
        return this.#effect.type === "effect" && this.#effect.isExpired;
    }

    get duration() {
        const effect = this.#effect;
        const isEffect = effect.type === "effect";

        return {
            type: "none",
            seconds: null,
            rounds: null,
            turns: null,
            combat: null,
            startTime: isEffect ? effect.system.activeDuration.activationTime : null,
            startRound: null,
            startTurn: isEffect ? effect.system.activeDuration.expiryInit : null,
            label: isEffect ? effect.system.activeDuration.remaining : ""
        };
    }

    getFlag(scope, flag) {
        return this.#effect.getFlag(scope, flag);
    }
}
