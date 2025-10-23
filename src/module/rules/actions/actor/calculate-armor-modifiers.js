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

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
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
