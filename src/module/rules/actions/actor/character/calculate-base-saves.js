export default function(engine) {
    engine.closures.add("calculateBaseSaves", (fact, context) => {
        const data = fact.data;
        const classes = fact.classes;

        let fortSave = 0;
        let refSave = 0;
        let willSave = 0;

        const fort = data.attributes.fort;
        const reflex = data.attributes.reflex;
        const will = data.attributes.will;

        for (const cls of classes) {
            const classData = cls.system;

            let slowSave = Math.floor(classData.levels * (1 / 3));
            let fastSave = Math.floor(classData.levels * 0.5) + 2;

            fortSave += classData.fort === "slow" ? slowSave : fastSave;
            fort.tooltip.push(game.i18n.format("SFRPG.SaveClassModTooltip", {
                class: cls.name,
                mod: classData.fort === "slow" ? slowSave.signedString() : fastSave.signedString()
            }));
            refSave += classData.ref === "slow" ? slowSave : fastSave;
            reflex.tooltip.push(game.i18n.format("SFRPG.SaveClassModTooltip", {
                class: cls.name,
                mod: classData.ref === "slow" ? slowSave.signedString() : fastSave.signedString()
            }));
            willSave += classData.will === "slow" ? slowSave : fastSave;
            will.tooltip.push(game.i18n.format("SFRPG.SaveClassModTooltip", {
                class: cls.name,
                mod: classData.will === "slow" ? slowSave.signedString() : fastSave.signedString()
            }));
        }

        fort.bonus = fortSave + data.abilities.con.mod;
        reflex.bonus = refSave + data.abilities.dex.mod;
        will.bonus = willSave + data.abilities.wis.mod;

        fort.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {
            ability: "Con",
            mod: data.abilities.con.mod.signedString()
        }));
        // this is done because the normal tooltip will be changed later on and we need this one as a "base" for dice rolls.
        fort.rollTooltip = [ ...skill.tooltip ];

        reflex.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {
            ability: "Dex",
            mod: data.abilities.dex.mod.signedString()
        }));
        // this is done because the normal tooltip will be changed later on and we need this one as a "base" for dice rolls.
        reflex.rollTooltip = [ ...skill.tooltip ];

        will.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {
            ability: "Wis",
            mod: data.abilities.wis.mod.signedString()
        }));
        // this is done because the normal tooltip will be changed later on and we need this one as a "base" for dice rolls.
        will.rollTooltip = [ ...skill.tooltip ];

        return fact;
    });
}
