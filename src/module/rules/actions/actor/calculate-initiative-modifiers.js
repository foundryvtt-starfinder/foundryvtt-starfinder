import { SFRPGModifierType, SFRPGEffectType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateInitiativeModifiers", (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const init = data.attributes.init;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, tooltip) => {
            let computedBonus = bonus.modifier;
            if (bonus.modifierType == "formula") {
                let r = new Roll(bonus.modifier, data).roll();
                computedBonus = r.total;
            }

            if (computedBonus !== 0) {
                tooltip.push(game.i18n.format("SFRPG.InitiativeModiferTooltip", {
                    type: bonus.type.capitalize(),
                    source: bonus.name,
                    mod: computedBonus.signedString()
                }));
            }

            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.INITIATIVE].includes(mod.effectType);
        });

        const mods = context.parameters.stackModifiers.process(filteredMods, context);

        const mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus, data, init.tooltip);
                }
            } else {
                prev += addModifier(curr[1], data, init.tooltip);
            }

            return prev;
        }, 0);

        /** @deprecated will be removed in v0.4.0 */
        const improvedInitiative = getProperty(flags, "sfrpg.improvedInititive") ? 4 : 0;
        const rapidResponse = getProperty(flags, "sfrpg.rapidResponse") ? 4 : 0;

        init.bonus = init.value + improvedInitiative + rapidResponse + mod;

        init.total += init.bonus;

        if (improvedInitiative !== 0) init.tooltip.push(game.i18n.format("SFRPG.InitiativeModiferTooltip", {
            type: SFRPGModifierTypes.UNTYPED.capitalize(),
            source: "Improved Initiative",
            mod: improvedInitiative.signedString()
        }));

        if (rapidResponse !== 0) init.tooltip.push(game.i18n.format("SFRPG.InitiativeModiferTooltip", {
            type: SFRPGModifierTypes.UNTYPED.capitalize(),
            source: "Rapid Response",
            mod: rapidResponse.signedString()
        }));

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}