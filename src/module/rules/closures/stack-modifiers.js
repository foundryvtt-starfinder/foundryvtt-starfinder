import { Closure } from "../../engine/closure/closure.js";
import { SFRPGModifierTypes } from "../../modifiers/types.js";

/**
 * Takes an array of modifiers and "stacks" them.
 */
export default class StackModifiers extends Closure {
    /**
     * @override
     *
     * Note: do not put Situational Modifiers in here. (modifiers that have dices inside the formula)
     *
     * @param {Array}   modifiers The modifiers to stack.
     * @param {Context} context   The context for this closure.
     *
     * @returns {Object}          An object containing only those modifiers allowed
     *                            based on the stacking rules.
     */
    process(mods, context) {
        const modifiers = mods;
        for (let modifiersI = 0; modifiersI < modifiers.length; modifiersI++) {
            const modifier = modifiers[modifiersI];
            const actor = game.actors.get(modifier.container.actorId);
            const formula = modifier.modifier;

            if (formula && actor) {
                try {
                    const roll = Roll.create(formula, actor.system);
                    if (roll.isDeterministic) {
                        const simplerFormula = Roll.replaceFormulaData(formula, actor.system, {missing:0, warn:true});
                        modifier.max = Roll.safeEval(simplerFormula);
                    } else {
                        ui.notifications.warn(`Problem with modifier: ${modifier.name}. Bro please... do not put dice formula into constant modifiers. This is not how they work.`
                        + `\nWhat would you do with that anyway? Have it recalculated every time the actor is updated?`);
                        modifier.max = 0;
                    }
                } catch (error) {
                    console.warn(`Could not calculate modifier: ${modifier.name} for actor with ID: ${modifier.container.actorId}. Setting to zero. Error: ${error}`);
                    modifier.max = 0;
                }
            } else {
                modifier.max = 0;
            }
        }
        return this._process(modifiers);
    }

    /**
     * In difference to normal "process" "processAsync" can calculate with dices and so it is allowed to take situational modifiers.
     * @param {Array} mods modifiers The modifiers to stack.
     * @param {Context} context The context for this closure.
     * @returns @returns {Object} An object containing only those modifiers allowed based on the stacking rules.
     */
    async processAsync(mods, context) {
        const modifiers = mods;
        if (modifiers.length > 0) {
            for (let modifiersI = 0; modifiersI < modifiers.length; modifiersI++) {
                const modifier = modifiers[modifiersI];
                const actor = game.actors.get(modifier.container.actorId);
                const formula = modifier.modifier;

                if (formula && actor) {
                    const roll = Roll.create(formula, actor.system);
                    const evaluatedRoll = await roll.evaluate({async: true});
                    modifiers[modifiersI].max = evaluatedRoll.total;
                } else {
                    modifiers[modifiersI].max = 0;
                }
            }
        }
        return this._process(modifiers);
    }

    _process(modifiers) {
        let [abilityMods,
            armorMods,
            baseMods,
            circumstanceMods,
            divineMods,
            enhancementMods,
            insightMods,
            luckMods,
            moraleMods,
            racialMods,
            untypedMods] = modifiers.reduce((prev, curr) => {
            switch (curr.type) {
            case SFRPGModifierTypes.ABILITY:
                prev[0].push(curr);
                break;
            case SFRPGModifierTypes.ARMOR:
                prev[1].push(curr);
                break;
            case SFRPGModifierTypes.BASE:
                prev[2].push(curr);
                break;
            case SFRPGModifierTypes.CIRCUMSTANCE:
                prev[3].push(curr);
                break;
            case SFRPGModifierTypes.DIVINE:
                prev[4].push(curr);
                break;
            case SFRPGModifierTypes.ENHANCEMENT:
                prev[5].push(curr);
                break;
            case SFRPGModifierTypes.INSIGHT:
                prev[6].push(curr);
                break;
            case SFRPGModifierTypes.LUCK:
                prev[7].push(curr);
                break;
            case SFRPGModifierTypes.MORALE:
                prev[8].push(curr);
                break;
            case SFRPGModifierTypes.RACIAL:
                prev[9].push(curr);
                break;
            case SFRPGModifierTypes.UNTYPED:
            default:
                prev[10].push(curr);
                break;
            }

            return prev;
        }, [[], [], [], [], [], [], [], [], [], [], []]);

        const ability = abilityMods?.filter(mod => mod.max > 0)?.sort((a, b) => b.max - a.max)
            ?.shift() ?? null;
        const armor = armorMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const base = baseMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const circumstance = circumstanceMods?.sort((a, b) => b.max - a.max);
        const divine = divineMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const enhancement = enhancementMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const insight = insightMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const luck = luckMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const morale = moraleMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const racial = racialMods?.sort((a, b) => b.max - a.max)?.shift() ?? null;
        const untyped = untypedMods?.sort((a, b) => b.max - a.max);

        return {
            ability,
            armor,
            base,
            circumstance,
            divine,
            enhancement,
            insight,
            luck,
            morale,
            racial,
            untyped
        };
    }
}
