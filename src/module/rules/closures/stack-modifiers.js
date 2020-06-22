import { Closure } from "../../engine/closure/closure.js";
import { StarfinderModifierTypes } from "../../modifiers/types.js";

/**
 * Takes an array of modifiers and "stacks" them according to
 * the rules outlined in the Starfinder Core Rulebook, 
 * p. 266 - 267.
 */
export default class StackModifiers extends Closure {
    /** 
     * @override 
     * 
     * @param {Array}   modifiers The modifiers to stack.
     * @param {Context} context   The context for this closure.
     * 
     * @returns {Object}          An object containing only those modifiers allowed 
     *                            based on the stacking rules.
     */
    process(modifiers, context) {
        let [abilityMods, armorMods, baseMods, circumstanceMods, divineMods, enhancementMods, insightMods, luckMods, moraleMods, racialMods, untypedMods] = modifiers.reduce((prev, curr) => {
            switch (curr.type) {
                case StarfinderModifierTypes.ABILITY:
                    prev[0].push(curr);
                    break;
                case StarfinderModifierTypes.ARMOR:
                    prev[1].push(curr);
                    break;
                case StarfinderModifierTypes.BASE:
                    prev[2].push(curr);
                    break;
                case StarfinderModifierTypes.CIRCUMSTANCE:
                    prev[3].push(curr);
                    break;
                case StarfinderModifierTypes.DIVINE:
                    prev[4].push(curr);
                    break;
                case StarfinderModifierTypes.ENHANCEMENT:
                    prev[5].push(curr);
                    break;
                case StarfinderModifierTypes.INSIGHT:
                    prev[6].push(curr);
                    break;
                case StarfinderModifierTypes.LUCK:
                    prev[7].push(curr);
                    break;
                case StarfinderModifierTypes.MORALE:
                    prev[8].push(curr);
                    break;
                case StarfinderModifierTypes.RACIAL:
                    prev[9].push(curr);
                    break;
                case StarfinderModifierTypes.UNTYPED:
                default:
                    prev[10].push(curr);
                    break;
            }

            return prev;
        }, [[], [], [], [], [], [], [], [], [], [], []]);

        const ability = abilityMods?.filter(mod => mod.modifier > 0)?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const armor = armorMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const base = baseMods?.sort((a, b) => b.modifier - a.modifer)?.shift() ?? null;
        const circumstance = circumstanceMods?.sort((a, b) => b.modifier - a.modifier);
        const divine = divineMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const enhancement = enhancementMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const insight = insightMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const luck = luckMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const morale = moraleMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const racial = racialMods?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const untyped = untypedMods?.sort((a, b) => b.modifer - a.modifier);

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