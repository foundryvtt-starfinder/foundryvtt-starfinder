import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateCMDModifiers", (fact, context) => {
        const cmd = fact.data.attributes.cmd;
        const modifiers = fact.modifiers;

        const addModifier = (bonus) => {
            let mod = bonus.modifier;

            if (mod !== 0) {
                cmd.tooltip.push(game.i18n.format("SFRPG.CMDModiferTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }

            return mod;
        };

        const filteredMods = modifiers.filter(mod => {
            return mod.enabled && 
                [SFRPGEffectType.CMD].includes(mod.effectType) &&
                mod.modifierType === SFRPGModifierType.CONSTANT;
        });

        const mods = context.parameters.stackModifiers.process(filteredMods, context);

        const cmdMod = Object.entries(mods).reduce((prev, curr) => {
            if (curr[1] === null || curr[1].length < 1) return prev;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                for (const bonus of curr[1]) {
                    prev += addModifier(bonus);
                }
            }
            else {
                prev += addModifier(curr[1]);
            }

            return prev;
        }, 0);

        cmd.value += cmdMod;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}