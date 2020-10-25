import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSaveModifiers", (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;
        const modifiers = fact.modifiers;
        const highest = Object.values({fort, reflex, will}).sort((a, b) => b.bonus - a.bonus).shift();
        const lowest = Object.values({fort, reflex, will}).sort((a, b) => a.bonus - b.bonus).shift();

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

            let saveMod = 0;
            switch (bonus.valueAffected) {
                case "highest":
                    if (item.bonus === highest.bonus) {
                        saveMod = computedBonus;
                    }
                    break;
                case "lowest":
                    if (item.bonus === lowest.bonus) {
                        saveMod = computedBonus;
                    }
                    break;
                default:
                    saveMod = computedBonus;
                    break;
            }
            computedBonus = saveMod;

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }
            
            return computedBonus;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && [SFRPGEffectType.SAVE, SFRPGEffectType.SAVES].includes(mod.effectType);
        });        

        const fortMods = context.parameters.stackModifiers.process(filteredMods.filter(mod => [
            "highest",
            "lowest",
            "fort"
        ].includes(mod.valueAffected) || mod.effectType === SFRPGEffectType.SAVES), context);
        const reflexMods = context.parameters.stackModifiers.process(filteredMods.filter(mod => [
            "highest",
            "lowest",
            "reflex"
        ].includes(mod.valueAffected) || mod.effectType === SFRPGEffectType.SAVES), context);
        const willMods = context.parameters.stackModifiers.process(filteredMods.filter(mod => [
            "highest",
            "lowest",
            "will"
        ].includes(mod.valueAffected) || mod.effectType === SFRPGEffectType.SAVES), context);

        let fortMod = Object.entries(fortMods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, fort, "SFRPG.SaveModifiersTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, fort, "SFRPG.SaveModifiersTooltip");
            }

            return sum;
        }, 0);

        let reflexMod = Object.entries(reflexMods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, reflex, "SFRPG.SaveModifiersTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, reflex, "SFRPG.SaveModifiersTooltip");
            }

            return sum;
        }, 0);

        let willMod = Object.entries(willMods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, will, "SFRPG.SaveModifiersTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, will, "SFRPG.SaveModifiersTooltip");
            }

            return sum;
        }, 0);

        fort.bonus += fort.misc + fortMod;
        reflex.bonus += reflex.misc + reflexMod;
        will.bonus += will.misc + willMod;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}