import { StarfinderEffectType, StarfinderModifierType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSkillArmorCheckPenalty", (fact, context) => {
        const armor = fact.armor;
        const skills = fact.data.skills;
        const modifiers = fact.modifiers;

        const addModifier = (bonus) => {
            let mod = 0;
            if (StarfinderEffectType.ACP_LIGHT && armor.data.armor.type === "light") {
                mod += bonus.modifier;
            }
            else if (StarfinderEffectType.ACP_HEAVY && armor.data.armor.type === "heavy") {
                mod += bonus.modifier;
            }
            else {
                mod += bonus.modifier;
            }

            return mod;
        };

        const acpMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.ACP, StarfinderEffectType.ACP_HEAVY, StarfinderEffectType.ACP_LIGHT].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(acpMods, context);
        const mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([StarfinderModifierTypes.CIRCUMSTANCE, StarfinderModifierTypes.UNTYPED].includes(curr[1].type)) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus);
                }
            }
            else {
                prev += addModifier(curr[1]);
            }

            return prev;
        }, 0);

        for (const skill of Object.values(skills)) {
            let acp = armor && armor.data.armor.acp < 0 && skill.hasArmorCheckPenalty ? armor.data.armor.acp : 0;
            if (acp < 0 && mod > 0) acp = Math.min(acp + mod, 0);

            skill.mod += acp;
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}