export default function (engine) {
    engine.closures.add("calculateCMD", (fact, context) => {
        const cmd = fact.data.attributes.cmd;
        const kac = fact.data.attributes.kac;

        cmd.value = 8 + kac.value;
        cmd.tooltip.push(game.i18n.localize("SFRPG.CMDBaseTooltip"));
        cmd.tooltip.push(game.i18n.format("SFRPG.CMDKACModTooltip", { kac: kac.value.signedString() }));

        return fact;
    });
}