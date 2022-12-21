import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add("calculateResolve", async (fact, context) => {
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
                const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                computedBonus = roll.total;
            } catch {}

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        let rpMax = 0; // Max(1, Max(1, Floor(Character Level / 2)) + Key Ability Score Modifier)

        // Level bonus
        let levelBonus = Math.max(1, Math.floor(data.details.level.value / 2));
        rpMax += levelBonus;

        data.attributes.rp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Resolve.LevelTooltip", {
            mod: levelBonus
        }));

        // Class bonus

        // on Key Ability Score Modifiers and multiclassing, CRB Pg. 27:
        // A multiclassed character can have more than one key ability score. For each class,
        // your key ability score remains the same as normal for that class (and for the class
        // features that rely on that score). For any key ability score calculation not tied
        // to class, such as determining your maximum Resolve Points, use whichever key ability
        // score has the highest value (and therefore the highest modifier).

        if (fact.classes && fact.classes.length > 0) {
            let keyAbilityScore = "";
            let highestKeyAbilityScoreModifier = -100;
            let className = "";

            for (const cls of fact.classes) {
                const classData = cls.system;

                if (!classData.kas) continue;
                let classScore = fact.data.abilities[classData.kas].mod;
                if (classScore > highestKeyAbilityScoreModifier) {
                    keyAbilityScore = classData.kas;
                    highestKeyAbilityScoreModifier = classScore;
                    className = cls.name;
                }
            }

            if (className) {
                rpMax += highestKeyAbilityScoreModifier;

                data.attributes.rp.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Header.Resolve.KeyAbilityTooltip", {
                    mod: highestKeyAbilityScoreModifier,
                    kas: keyAbilityScore.capitalize(),
                    source: className
                }));
            }
        }

        rpMax = Math.max(1, rpMax);

        // Iterate through any modifiers that affect RP
        let filteredModifiers = fact.modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && mod.effectType == SFRPGEffectType.RESOLVE_POINTS;
        });
        filteredModifiers = await context.parameters.stackModifiers.process(filteredModifiers, context);

        let bonus = Object.entries(filteredModifiers).reduce((sum, mod) => {
            if (mod[1] === null || mod[1].length < 1) return sum;

            if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(mod[0])) {
                for (const bonus of mod[1]) {
                    sum += addModifier(bonus, data, data.attributes.rp, "SFRPG.AbilityScoreBonusTooltip");
                }
            } else {
                sum += addModifier(mod[1], data, data.attributes.rp, "SFRPG.AbilityScoreBonusTooltip");
            }

            return sum;
        }, 0);

        rpMax += bonus;

        data.attributes.rp.max = rpMax;

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
