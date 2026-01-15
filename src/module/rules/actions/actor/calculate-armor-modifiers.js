import { SFRPGEffectType, SFRPGModifierType } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {
        const data = fact.data;
        const modifiers = fact.modifiers;

        const eac = data.attributes.eac;
        const kac = data.attributes.kac;
        eac.tooltip = eac.tooltip ?? [];
        kac.tooltip = kac.tooltip ?? [];

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let computedBonus = 0;
            try {
                const roll = Roll.create(bonus.modifier.toString(), data).evaluateSync({strict: false});
                computedBonus = roll.total;
            } catch (e) {
                console.error(e);
            }

            let computedBonusAdjust = 0;
            if (computedBonus !== 0 && localizationKey) {
                if (bonus.type === "armor" && !foundry.utils.isEmpty(item.armorInfo)) {
                    // If an armor bonus from modifiers is higher than that provided by the wearer's armor, don't count the worn armor
                    if (computedBonus > item.armorInfo.bonus) {
                        const targetTooltipIndex = item.tooltip.findIndex(tip => tip === item.armorInfo.tooltip);
                        if (targetTooltipIndex >= 0) {
                            delete item.tooltip[targetTooltipIndex]; // Remove armor tooltip
                            computedBonusAdjust = item.armorInfo.bonus; // Amount to adjust returned bonus by
                        }
                    } else {
                        // Return 0 for the bonus, don't add to tooltip if armor is better
                        return 0;
                    }
                }
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            // Return the computed bonus, adjusting it downward by the armor's AC value if less than the armor bonus from modifiers
            return computedBonus - computedBonusAdjust;
        };

        const armorMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.AC].includes(mod.effectType);
        });

        const eacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["eac", "both"].includes(mod.valueAffected)), context, {actor: fact.actor});
        const kacMods = context.parameters.stackModifiers.process(armorMods.filter(mod => ["kac", "both"].includes(mod.valueAffected)), context, {actor: fact.actor});

        const eacMod = Object.entries(eacMods).reduce((sum, curr) => {
            for (const bonus of curr[1]) {
                sum += addModifier(bonus, data, eac, "SFRPG.ACTooltipBonus");
            }
            return sum;
        }, 0);

        const kacMod = Object.entries(kacMods).reduce((sum, curr) => {
            for (const bonus of curr[1]) {
                sum += addModifier(bonus, data, kac, "SFRPG.ACTooltipBonus");
            }
            return sum;
        }, 0);

        eac.value += eacMod;
        kac.value += kacMod;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
