import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSkillArmorCheckPenalty", (fact, context) => {
        const armor = fact.armor;
        const skills = fact.data.skills;
        const modifiers = fact.modifiers;
        const flags = fact.flags;

        const addModifier = (bonus, data) => {
            let computedBonus = bonus.modifier;
            if (bonus.modifierType == "formula") {
                let r = new Roll(bonus.modifier, data).roll();
                computedBonus = r.total;
            }

            let mod = 0;
            if (bonus.valueAffected === "acp-light" && armor.data.armor.type === "light") {
                mod = computedBonus;
            }
            else if (bonus.valueAffected === "acp-heavy" && armor.data.armor.type === "heavy") {
                mod = computedBonus;
            }
            else {
                mod = computedBonus;
            }

            return mod;
        };

        /** @deprecated Will be removed in 0.4.0 */
        const armorSavant = getProperty(flags, 'sfrpg.armorSavant') ? 1 : 0;

        const acpMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.ACP].includes(mod.effectType);
        });

        const mods = context.parameters.stackModifiers.process(acpMods, context);
        let mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[1].type)) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus, fact.data);
                }
            }
            else {
                prev += addModifier(curr[1], fact.data);
            }

            return prev;
        }, 0);

        if (armorSavant > 0) mod += armorSavant;

        for (const skill of Object.values(skills)) {
            let acp = armor && armor.data.armor.acp < 0 && skill.hasArmorCheckPenalty ? armor.data.armor.acp : 0;
            if (acp < 0 && mod > 0) acp = Math.min(acp + mod, 0);

            skill.mod += acp;

            if (acp >= 0) continue;
            skill.tooltip.push(game.i18n.format("SFRPG.ACPTooltip", {acp: acp.signedString()}));
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}