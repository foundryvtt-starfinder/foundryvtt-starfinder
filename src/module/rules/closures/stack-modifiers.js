import { Closure } from "../../engine/closure/closure.js";
import { SFRPGModifierTypes } from "../../modifiers/types.js";

/**
 * Takes an array of modifiers and "stacks" them.
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
    async process(modifiers, context) {

        if (modifiers.length > 0) {
            for (let modifiersI = 0; modifiersI < modifiers.length; modifiersI++) {
                const modifier = modifiers[modifiersI];
                const actor = game.actors.get(modifier.container.actorId);

                const formula = modifier.modifier;
                if (formula) {
                    const roll = Roll.create(formula, actor.system);
                    modifier.max = await roll.evaluate({maximize: true}).total;
                } else {
                    modifier.max = 0;
                }
            }
        }

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
