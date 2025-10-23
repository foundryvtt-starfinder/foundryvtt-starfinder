export default function(engine) {
    engine.closures.add("calculateCMD", (fact) => {
        const data = fact.data;
        if (!data.attributes.cmd) data.attributes.cmd = {};
        if (!data.attributes.kac) data.attributes.kac = {tooltip: []};

        const cmd = data.attributes.cmd;
        const kac = data.attributes.kac;

        cmd.tooltip = [];

        cmd.value = 8 + kac.value;
        cmd.tooltip.push(game.i18n.localize("SFRPG.CMDBaseTooltip"));
        cmd.tooltip.push(game.i18n.format("SFRPG.CMDKACModTooltip", { kac: kac.value.signedString() }));

        return fact;
    });
}
