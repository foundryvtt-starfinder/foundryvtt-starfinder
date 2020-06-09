export default function (engine) {
    engine.closures.add("calculateCMD", (fact, context) => {
        const cmd = fact.data.attributes.cmd;
        const kac = fact.data.attributes.kac;

        cmd.value = 8 + kac.value;
        cmd.tooltip = [
            game.i18n.localize("STARFINDER.CMDBaseTooltip"),
            game.i18n.format("STARFINDER.CMDKACModTooltip", { kac: kac.value.signedString() })
        ];

        return fact;
    });
}