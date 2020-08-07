import { SFRPGEffectType } from "../../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateResolve", (fact, context) => {
        const data = fact.data;

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
                if (!cls.data.kas) continue;
                let classScore = fact.data.abilities[cls.data.kas].mod;
                if (classScore > highestKeyAbilityScoreModifier) {
                    keyAbilityScore = cls.data.kas;
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
        const rpModifiers = fact.modifiers.filter(mod => {
            return mod.enabled && mod.effectType == SFRPGEffectType.RESOLVE_POINTS;
        });
        
        rpModifiers.forEach(bonus => {
            let rpBonus = bonus.modifier;
            if (rpBonus !== 0) {
                rpMax += rpBonus;

                data.attributes.rp.tooltip.push(game.i18n.format("SFRPG.AbilityModifiersTooltip", {
                    type: bonus.type.capitalize(),
                    mod: bonus.modifier.signedString(),
                    source: bonus.name
                }));
            }
        });

        data.attributes.rp.max = rpMax;

        return fact;
    });
}