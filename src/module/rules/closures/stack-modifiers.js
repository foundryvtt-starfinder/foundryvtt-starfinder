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
        let [ability, armor, base, circumstance, divine, enhancement, insight, luck, morale, racial, untyped] = modifiers.reduce((prev, curr) => {
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

        const abilityMod = ability?.filter(mod => mod.modifier > 0)?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const armorMod = armor?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const baseMod = base?.sort((a, b) => b.modifier - a.modifer)?.shift() ?? null;
        const circumstanceMods = circumstance?.sort((a, b) => b.modifier - a.modifier);
        const divineMod = divine?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const enhancementMod = enhancement?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const insightMod = insight?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const luckMod = luck?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const moraleMod = morale?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const racialMod = racial?.sort((a, b) => b.modifier - a.modifier)?.shift() ?? null;
        const untypedMods = untyped?.sort((a, b) => b.modifer - a.modifier);

        return {
            abilityMod,
            armorMod,
            baseMod,
            circumstanceMods,
            divineMod,
            enhancementMod,
            insightMod,
            luckMod,
            moraleMod,
            racialMod,
            untypedMods
        };
    }
}