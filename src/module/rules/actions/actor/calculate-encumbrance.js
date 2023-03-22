import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateEncumbrance", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;
        const actorData = actor.system;

        let tooltip = [];
        if (data.encumbrance) {
            tooltip = encumbrance.tooltip;
        }

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
                const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                computedBonus = roll.total;
            } catch {}

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: game.i18n.format(`SFRPG.ModifierType${bonus.type.capitalize()}`),
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
            return (mod.enabled || mod.modifierType === "formula") && mod.effectType == SFRPGEffectType.BULK;
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

        const _computeEncumbrance = (totalWeight, actorData) => {
            const enc = {
                max: actorData.attributes.encumbrance.max,
                tooltip: actorData.attributes.encumbrance.tooltip,
                value: totalWeight
            };

            enc.pct = Math.min(enc.value * 100 / enc.max, 99);
            enc.encumbered = enc.pct > 50;
            return enc;
        };

        actorData.encumbrance = _computeEncumbrance(actorData.bulk, actorData);
        data.encumbrance = actorData.encumbrance;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
