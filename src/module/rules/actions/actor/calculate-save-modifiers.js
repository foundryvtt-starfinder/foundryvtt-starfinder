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

        const addModifier = (bonus, data, save) => {
            let computedBonus = bonus.modifier;
            if (bonus.modifierType == "formula") {
                let r = new Roll(bonus.modifier, data).roll();
                computedBonus = r.total;
            }

            let saveMod = 0;
            
            switch (bonus.valueAffected) {
                case "highest":
                    if (save.bonus === highest.bonus) saveMod = computedBonus;
                    break;
                case "lowest":
                    if (save.bonus === lowest.bonus) saveMod = computedBonus;
                    break;
                default:
                    saveMod = computedBonus;
                    break;
            }

            if (saveMod !== 0) {
                save.tooltip.push(game.i18n.format("SFRPG.SaveModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: saveMod.signedString(),
                    source: bonus.name
                }));
            }
            
            return saveMod;
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
                    sum += addModifier(bonus, data, fort);
                }
            } else {
                sum += addModifier(mod[1], data, fort);
            }

            return sum;
        }, 0);

        let reflexMod = Object.entries(reflexMods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, reflex);
                }
            } else {
                sum += addModifier(mod[1], data, reflex);
            }

            return sum;
        }, 0);

        let willMod = Object.entries(willMods).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, will);
                }
            } else {
                sum += addModifier(mod[1], data, will);
            }

            return sum;
        }, 0);

        /** @deprecated Will be removed in v0.4.0 */
        const greatFortitude = getProperty(flags, "sfrpg.greatFortitude") ? 2 : 0;
        const lightningReflexes = getProperty(flags, "sfrpg.lightningReflexes") ? 2 : 0;
        const ironWill = getProperty(flags, "sfrpg.ironWill") ? 2 : 0;

        fort.bonus += fort.misc + greatFortitude + fortMod;
        reflex.bonus += reflex.misc + lightningReflexes + reflexMod;
        will.bonus += will.misc + ironWill + willMod;

        if (greatFortitude !== 0) fort.tooltip.push(game.i18n.format("SFRPG.SaveModifiersTooltip", {
            type: SFRPGModifierTypes.UNTYPED.capitalize(),
            source: "Great Fortitude",
            mod: greatFortitude.signedString()
        }));

        if (lightningReflexes !== 0) fort.tooltip.push(game.i18n.format("SFRPG.SaveModifiersTooltip", {
            type: SFRPGModifierTypes.UNTYPED.capitalize(),
            source: "Lightning Reflexes",
            mod: lightningReflexes.signedString()
        }));

        if (ironWill !== 0) fort.tooltip.push(game.i18n.format("SFRPG.SaveModifiersTooltip", {
            type: SFRPGModifierTypes.UNTYPED.capitalize(),
            source: "Iron Will",
            mod: ironWill.signedString()
        }));

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}