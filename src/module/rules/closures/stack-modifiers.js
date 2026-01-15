import { Closure } from "../../engine/closure/closure.js";
import { SFRPGModifierType, SFRPGModifierTypes } from "../../modifiers/types.js";
import SFRPGRoll from "../../rolls/roll.js";

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
     * @param {Object} options    Some options for this closure. F.e. we can provide the whole actor here.
     * @returns {Object}          An object containing only those modifiers allowed
     *                            based on the stacking rules.
     */
    process(mods, context, options = { actor: null, item: null }) {
        const modifiers = mods;
        for (const modifier of modifiers) {
            const actor = options.actor;
            const item = options.item;
            const formula = String(modifier.modifier);

            if (formula && (modifier.modifierType === SFRPGModifierType.CONSTANT)) {
                try {
                    const data = {};
                    if (actor?.system) {
                        Object.assign(data, actor.system);
                        Object.assign(data, {"owner": actor.system});
                    }
                    if (item?.system) {
                        Object.assign(data, {"item": item.system});
                    }
                    const roll = Roll.create(formula, data);
                    if (roll.isDeterministic) {
                        const warn = game.settings.get("sfrpg", "warnInvalidRollData") || false;
                        const simplerFormula = SFRPGRoll.replaceFormulaData(formula, data, {missing: 0, warn});
                        modifier.max = Roll.safeEval(simplerFormula);
                    } else {
                        ui.notifications.error(`Error with modifier: ${modifier.name}. Dice are not available in constant formulas. Please use a situational modifier instead.`);
                        modifier.max = 0;
                    }
                } catch (error) {
                    console.warn(`Could not calculate modifier: ${modifier.name} for actor: ${modifier.actor.name}. Setting to zero. ${error}`);
                    modifier.max = 0;
                }
            } else {
                modifier.max = 0;
                if (modifier.modifierType === SFRPGModifierType.FORMULA) {
                    console.warn(`Situational modifier: ${modifier.name} was found in constant modifier calculation. How did that end up in here?`);
                }
            }
        }
        return this._process(modifiers);
    }

    /**
     * In difference to normal "process" "processAsync" can calculate with dices and so it is allowed to take situational modifiers.
     * @param {Array} mods modifiers The modifiers to stack.
     * @param {Context} context The context for this closure.
     * @param {Object} options Some options for this closure. F.e. we can provide the whole actor here.
     * @returns {Object} An object containing only those modifiers allowed based on the stacking rules.
     */
    async processAsync(mods, context, options = { actor: null }) {
        const modifiers = mods;
        if (modifiers.length > 0) {
            for (const modifier of modifiers) {
                const actor = options.actor;
                const formula = String(modifier.modifier);

                if (formula) {
                    const roll = Roll.create(formula, actor?.system);
                    let evaluatedRoll = {};
                    try {
                        evaluatedRoll = await roll.evaluate();
                    } catch {
                        evaluatedRoll = {
                            total: 0,
                            dice: []
                        };
                    }
                    modifier.max = evaluatedRoll.total;
                    modifier.isDeterministic = roll.isDeterministic;
                    modifier.dices = [];

                    if (!roll.isDeterministic) {
                        for (let allDiceI = 0; allDiceI < evaluatedRoll.dice.length; allDiceI++) {
                            const die = evaluatedRoll.dice[allDiceI];
                            if (!die) continue;
                            modifier.dices.push({
                                formula: `${die.number}d${die.faces}`,
                                faces: die.faces,
                                total: die.results.reduce((pv, cv) => pv + cv.result, 0)
                            });
                        }
                    }
                } else {
                    modifier.max = 0;
                }
            }
        }
        return this._process(modifiers);
    }

    _process(modifiers) {
        const [abilityMods,
            armorMods,
            baseMods,
            circumstanceMods,
            divineMods,
            enhancementMods,
            insightMods,
            luckMods,
            moraleMods,
            racialMods,
            untypedMods,
            resistanceMods,
            weaponSpecializationMods] = modifiers.reduce((prev, curr) => {
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
                case SFRPGModifierTypes.RESISTANCE:
                    prev[11].push(curr);
                    break;
                case SFRPGModifierTypes.WEAPON_SPECIALIZATION:
                    prev[12].push(curr);
                    break;
                case SFRPGModifierTypes.UNTYPED:
                default:
                    prev[10].push(curr);
                    break;
            }

            return prev;
        }, [[], [], [], [], [], [], [], [], [], [], [], [], []]);

        const ability = abilityMods.length
            ? [abilityMods.filter(mod => mod.max > 0).sort((a, b) => b.max - a.max)
                ?.shift()]
            : [];
        const armor = armorMods.length ? [armorMods.sort((a, b) => b.max - a.max).shift()] : [];
        const base = baseMods.length ? [baseMods.sort((a, b) => b.max - a.max).shift()] : [];
        const circumstance = circumstanceMods.length ? circumstanceMods?.sort((a, b) => b.max - a.max) : [];
        const divine = divineMods.length ? [divineMods.sort((a, b) => b.max - a.max).shift()] : [];
        const enhancement = enhancementMods.length ? [enhancementMods.sort((a, b) => b.max - a.max).shift()] : [];
        const insight = insightMods.length ? [insightMods.sort((a, b) => b.max - a.max).shift()] : [];
        const luck = luckMods.length ? [luckMods.sort((a, b) => b.max - a.max).shift()] : [];
        const morale = moraleMods.length ? [moraleMods.sort((a, b) => b.max - a.max).shift()] : [];
        const racial = racialMods.length ? [racialMods.sort((a, b) => b.max - a.max).shift()] : [];
        const resistance = resistanceMods.length ? [resistanceMods.sort((a, b) => b.max - a.max).shift()] : [];
        const untyped = untypedMods.length ? untypedMods?.sort((a, b) => b.max - a.max) : [];
        const weaponSpecialization = weaponSpecializationMods.length ? [weaponSpecializationMods.sort((a, b) => b.max - a.max).shift()] : [];

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
            resistance,
            untyped,
            weaponSpecialization
        };
    }
}
