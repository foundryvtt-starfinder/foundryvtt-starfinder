import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateStamina", (fact, context) => {
        const data = fact.data;

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

        let spMax = 0; // Max(Constitution Modifier * Character level + Class' SP per level * Class Level, 0)

        // Constitution bonus
        const constitutionBonus = data.abilities.con.mod * data.details.level.value;
        spMax += constitutionBonus;

        data.attributes.sp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Stamina.ConstitutionTooltip", {
            mod: constitutionBonus
        }));

        // Class bonus
        if (fact.classes && fact.classes.length > 0) {
            for (const cls of fact.classes) {
                const classData = cls.system;

                const classBonus = Math.floor(classData.levels * classData.sp.value);
                spMax += classBonus;

                data.attributes.sp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Stamina.ClassTooltip", {
                    mod: classBonus,
                    source: cls.name
                }));
            }
        }

        spMax = Math.max(spMax, 0);

        // Iterate through any modifiers that affect SP
        let filteredModifiers = fact.modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && mod.effectType == SFRPGEffectType.STAMINA_POINTS;
        });
        filteredModifiers = context.parameters.stackModifiers.process(filteredModifiers, context, {actor: fact.actor});

        const bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.sp, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.sp, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);

        spMax += bonus;

        data.attributes.sp.max = spMax;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
