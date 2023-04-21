import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateInitiativeModifiers", (fact, context) => {
        const data = fact.data;
        const init = data.attributes.init;
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, item, localizationKey) => {
            if (item.calculatedMods) {
                item.calculatedMods.push({mod: bonus.modifier, bonus: bonus});
            } else {
                item.calculatedMods = [{mod: bonus.modifier, bonus: bonus}];
            }

            let computedBonus = bonus.max || 0;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.INITIATIVE].includes(mod.effectType);
        });

        const mods = context.parameters.stackModifiers.process(filteredMods.filter(mod => {
            if (mod.modifierType === SFRPGModifierType.FORMULA) {
                if (init.rolledMods) {
                    init.rolledMods.push({mod: mod.modifier, bonus: mod});
                } else {
                    init.rolledMods = [{mod: mod.modifier, bonus: mod}];
                }
                return false;
            }
        }), context);

        const mod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus, data, init, "SFRPG.InitiativeModiferTooltip");
                }
            } else {
                prev += addModifier(curr[1], data, init, "SFRPG.InitiativeModiferTooltip");
            }

            return prev;
        }, 0);

        init.bonus = init.value + mod;

        init.total += init.bonus;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
