export default function (engine) {
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
            let slowSave = Math.floor(cls.data.levels * (1/3));
            let fastSave = Math.floor(cls.data.levels * 0.5) + 2;

            fortSave += cls.data.fort === "slow" ? slowSave : fastSave;
            fort.tooltip.push(game.i18n.format("SFRPG.SaveClassModTooltip", {
                class: cls.name,
                mod: cls.data.fort === "slow" ? slowSave.signedString() : fastSave.signedString()
            }));
            refSave += cls.data.ref === "slow" ? slowSave : fastSave;
            reflex.tooltip.push(game.i18n.format("SFRPG.SaveClassModTooltip", {
                class: cls.name,
                mod: cls.data.ref === "slow" ? slowSave.signedString() : fastSave.signedString()
            }));
            willSave += cls.data.will === "slow" ? slowSave : fastSave;
            will.tooltip.push(game.i18n.format("SFRPG.SaveClassModTooltip", {
                class: cls.name,
                mod: cls.data.will === "slow" ? slowSave.signedString() : fastSave.signedString()
            }));
        }

        fort.bonus = fortSave + data.abilities.con.mod;
        reflex.bonus = refSave + data.abilities.dex.mod;
        will.bonus = willSave + data.abilities.wis.mod;

        fort.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {
            ability: "Con",
            mod: data.abilities.con.mod.signedString()
        }));

        reflex.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {
            ability: "Dex",
            mod: data.abilities.dex.mod.signedString()
        }));

        will.tooltip.push(game.i18n.format("SFRPG.SaveAbilityModTooltip", {
            ability: "Wis",
            mod: data.abilities.wis.mod.signedString()
        }));

        return fact;
    });
}