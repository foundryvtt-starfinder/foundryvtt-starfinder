import { StarfinderEffectType, StarfinderModifierType, StarfinderModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateSaveModifiers", (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;
        const modifiers = fact.modifiers;

        const processModifier = (bonus, obj) => {
            switch (bonus.effectType) {
                case StarfinderEffectType.SAVES:
                    if (!obj["all"]) obj["all"] = [bonus];
                    else obj["all"].push(bonus);
                    break;
                case StarfinderEffectType.SAVE:
                    if (!obj[bonus.valueAffected]) obj[bonus.valueAffected] = [bonus];
                    else obj[bonus.valueAffected].push(bonus);
                    break;
            }
        };

        const addModifier = (bonuses, save) => {
            if (!bonuses) return 0;

            let saveMod = 0;

            for (const bonus of bonuses) {
                saveMod += bonus.modifier;

                if (bonus.modifier !== 0) {
                    save.tooltip.push(game.i18n.format("STARFINDER.SaveModifiersTooltip", {
                        type: bonus.type.capitalize(),
                        mod: bonus.modifier.signedString(),
                        source: bonus.name
                    }));
                }
            }
            
            return saveMod;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [StarfinderEffectType.SAVE, StarfinderEffectType.SAVES].includes(mod.effectType) &&
                mod.modifierType === StarfinderModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(filteredMods, context);

        const saveMods = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if (curr[0] === StarfinderModifierTypes.CIRCUMSTANCE || curr[0] === StarfinderModifierTypes.UNTYPED) {
                for (const bonus of curr[1]) {
                    processModifier(bonus, prev);
                }
            } else {
                processModifier(curr[1], prev);
            }

            return prev;
        }, {});

        /** @deprecated Will be removed in v0.4.0 */
        const greatFortitude = getProperty(flags, "starfinder.greatFortitude") ? 2 : 0;
        const lightningReflexes = getProperty(flags, "starfinder.lightningReflexes") ? 2 : 0;
        const ironWill = getProperty(flags, "starfinder.ironWill") ? 2 : 0;

        let fortMod = 0;
        let reflexMod = 0;
        let willMod = 0;

        if (saveMods["all"]) {
            fortMod += addModifier(saveMods["all"], fort);
            reflexMod += addModifier(saveMods["all"], reflex);
            willMod += addModifier(saveMods["all"], will);
        }

        fortMod += addModifier(saveMods["fort"], fort);
        reflexMod += addModifier(saveMods["reflex"], reflex);
        willMod += addModifier(saveMods["will"], will);

        fort.bonus += fort.misc + greatFortitude + fortMod;
        reflex.bonus += reflex.misc + lightningReflexes + reflexMod;
        will.bonus += will.misc + ironWill + willMod;

        if (greatFortitude !== 0) fort.tooltip.push(game.i18n.format("STARFINDER.SaveModifiersTooltip", {
            type: StarfinderModifierTypes.UNTYPED.capitalize(),
            source: "Great Fortitude",
            mod: greatFortitude.signedString()
        }));

        if (lightningReflexes !== 0) fort.tooltip.push(game.i18n.format("STARFINDER.SaveModifiersTooltip", {
            type: StarfinderModifierTypes.UNTYPED.capitalize(),
            source: "Lightning Reflexes",
            mod: lightningReflexes.signedString()
        }));

        if (ironWill !== 0) fort.tooltip.push(game.i18n.format("STARFINDER.SaveModifiersTooltip", {
            type: StarfinderModifierTypes.UNTYPED.capitalize(),
            source: "Iron Will",
            mod: ironWill.signedString()
        }));

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}