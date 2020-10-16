import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateEncumbrance", (fact, context) => {
        const data = fact.data;

        let tooltip = [];
        if (data.encumbrance) {
            tooltip = encumbrance.tooltip;
        }

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (localizationKey) {
                    item.tooltip.push(game.i18n.format(localizationKey, {
                        type: bonus.type.capitalize(),
                        mod: bonus.modifier,
                        source: bonus.name
                    }));
                }
                
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let roll = new Roll(bonus.modifier.toString(), data).evaluate({maximize: true});
            let computedBonus = roll.total;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };

        let strength = Number(data.abilities.str.value);
        let max = Number.isNaN(strength) ? 0 : strength;

        tooltip.push(game.i18n.format("SFRPG.ActorSheet.Inventory.Encumbrance.EncumbranceBaseTooltip", {
            base: strength.signedString()
        }));
        
        // Iterate through any modifiers that affect encumbrance
        let filteredModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.BULK;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context);

        let encumbrance = {
            value: 0,
            tooltip: tooltip,
            rolledMods: []
        };

        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, encumbrance, "SFRPG.ActorSheet.Inventory.Encumbrance.EncumbranceModifierTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, encumbrance, "SFRPG.ActorSheet.Inventory.Encumbrance.EncumbranceModifierTooltip");
            }

            return sum;
        }, 0);

        data.attributes.encumbrance = {
            max: max + bonus,
            value: 0,
            pct: 0,
            encumbered: false,
            tooltip: encumbrance.tooltip,
            rolledMods: encumbrance.rolledMods
        };
        
        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}