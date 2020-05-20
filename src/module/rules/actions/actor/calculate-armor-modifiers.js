export default function (engine) {
    engine.closures.add("calculateArmorModifiers", (fact, context) => {
        // TODO: Refactor when the full modifiers system is in place
        // right now this is only processing the armor savant flag.
        const data = fact.data;
        const flags = fact.flags;
        const armor = fact.armor;

        if (!flags) return fact;
        if (!armor) return fact;

        let armorSavant = getProperty(flags, "starfinder.armorSavant") ? 1 : 0;

        data.attributes.eac.value += armorSavant;
        data.attributes.kac.value += armorSavant;

        return fact;
    });
}