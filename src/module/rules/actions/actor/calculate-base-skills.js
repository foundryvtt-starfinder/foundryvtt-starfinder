export default function (engine) {
    engine.closures.add('calculateBaseSkills', (fact, context) => {
        const data = fact.data;
        const flags = fact.flags;
        const armor = fact.aromr;

        // These will be removed and placed in a different method
        // once modifiers system is more fleshed out.
        // All of the relevent flags that modify skill bonuses
        let flatAffect = getProperty(flags, "starfinder.flatAffect") ? -2 : 0;
        let historian = getProperty(flags, "starfinder.historian") ? 2 : 0;
        let naturalGrace = getProperty(flags, "starfinder.naturalGrace") ? 2 : 0;
        let cultrualFascination = getProperty(flags, "starfinder.culturalFascination") ? 2 : 0;
        let armorSavant = getProperty(flags, "starfinder.armorSavant") ? 1 : 0;
        let scrounger = getProperty(flags, "starfinder.scrounger") ? 2 : 0;
        let elvenMagic = getProperty(flags, "starfinder.elvenMagic") ? 2 : 0;
        let keenSenses = getProperty(flags, "starfinder.keenSenses") ? 2 : 0;
        let curious = getProperty(flags, "starfinder.curious") ? 2 : 0;
        let intimidating = getProperty(flags, "starfinder.intimidating") ? 2 : 0;
        let selfSufficient = getProperty(flags, "starfinder.selfSufficient") ? 2 : 0;
        let sneaky = getProperty(flags, "starfinder.sneaky") ? 2 : 0;
        let sureFooted = getProperty(flags, "starfinder.sureFooted") ? 2 : 0;

        // Skills
        for (let [skl, skill] of Object.entries(data.skills)) {
            let accumulator = 0;
            // Specific skill modifiers
            switch (skl) {
                case "acr":
                    accumulator += naturalGrace;
                    accumulator += sureFooted;
                    break;
                case "ath":
                    accumulator += naturalGrace;
                    accumulator += sureFooted;
                    break;
                case "cul":
                    accumulator += historian;
                    accumulator += cultrualFascination;
                    accumulator += curious;
                    break;
                case "dip":
                    accumulator += cultrualFascination;
                    break;
                case "eng":
                    accumulator += scrounger;
                    break;
                case "int":
                    accumulator += intimidating;
                    break;
                case "mys":
                    accumulator += elvenMagic;
                    break;
                case "per":
                    accumulator += keenSenses;
                    break;
                case "sen":
                    accumulator += flatAffect;
                    break;
                case "ste":
                    accumulator += scrounger;
                    accumulator += sneaky;
                    break;
                case "sur":
                    accumulator += scrounger;
                    accumulator += selfSufficient;
                    break;
            }

            skill.value = parseFloat(skill.value || 0);
            let classSkill = skill.value;
            let hasRanks = skill.ranks > 0;
            let acp = armor && armor.data.armor.acp < 0 && skill.hasArmorCheckPenalty ? armor.data.armor.acp : 0;
            if (acp < 0 && armorSavant > 0) acp = Math.min(acp + armorSavant, 0);
            skill.mod = data.abilities[skill.ability].mod + acp + skill.ranks + (hasRanks ? classSkill : 0) + skill.misc + accumulator;
        }

        return fact;
    });
}
