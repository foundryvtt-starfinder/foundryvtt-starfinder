export default function(engine) {
    engine.closures.add("calculateTraits", (fact, context) => {
        const data = fact.data;

        /** Update race field, but only if it is left empty. */
        try {
            const races = fact.races;
            let race = data.details.race;
            if (!race && races.length > 0) {
                race = races[0].name;
            }
            data.details.race = race;
        } catch (error) {

        }

        /** Update theme field, but only if it is left empty. */
        try {
            if (!data.details.theme && fact.theme) {
                data.details.theme = fact.theme.name;
            }
        } catch (error) {

        }

        /** Update proficiencies from classes, but only if they are not set yet by the user. */
        try {
            const classes = fact.classes;
            for (const cls of classes) {
                const classData = cls.system;

                for (const [key, value] of Object.entries(classData.proficiencies.weapon)) {
                    if (value && !data.traits.weaponProf.value.includes(key)) {
                        data.traits.weaponProf.value.push(key);
                    }
                }
                for (const [key, value] of Object.entries(classData.proficiencies.armor)) {
                    if (value && !data.traits.armorProf.value.includes(key)) {
                        data.traits.armorProf.value.push(key);
                    }
                }
            }
        } catch (error) {

        }

        return fact;
    });
}
