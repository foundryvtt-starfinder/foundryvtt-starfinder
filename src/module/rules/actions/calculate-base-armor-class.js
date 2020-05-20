export default function (engine) {
    engine.closures.add("calculateBaseArmorClass", (fact, context) => {
        const data = fact.data;
        const armor = fact.armor;

        if (armor) {
            let eacMod = armor.data.armor.eac + Math.min(data.abilities.dex.mod, armor.data.armor.dex || Number.MAX_SAFE_INTEGER);
            let kacMod = armor.data.armor.kac + Math.min(data.abilities.dex.mod, armor.data.armor.dex || Number.MAX_SAFE_INTEGER);

            if (!armor.data.proficient) {
                eacMod -= 4;
                kacMod -= 4;
            }

            data.attributes.eac.value = 10 + eacMod;
            data.attributes.kac.value = 10 + kacMod;
        } else {
            data.attributes.eac.value = 10 + data.abilities.dex.mod;
            data.attributes.kac.value = 10 + data.abilities.dex.mod;
        }

        return fact;
    });
}