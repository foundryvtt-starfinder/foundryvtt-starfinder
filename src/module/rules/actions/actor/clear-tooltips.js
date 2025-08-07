export default function(engine) {
    engine.closures.add("clearTooltips", (fact) => {
        const data = fact.data;

        if (data.details.level) {
            data.details.level.tooltip = [];
        }

        if (data.details.cl) {
            data.details.cl.tooltip = [];
        }

        if (data.attributes.hp) {
            data.attributes.hp.tooltip = [];
        }

        if (data.attributes.sp) {
            data.attributes.sp.tooltip = [];
        }

        if (data.attributes.rp) {
            data.attributes.rp.tooltip = [];
        }

        if (data.abilities) {
            for (const ability of Object.values(data.abilities)) {
                ability.tooltip = [];
                ability.modifierTooltip = [];
            }
        }

        if (data.attributes.eac) {
            data.attributes.eac.tooltip = [];
        }

        if (data.attributes.kac) {
            data.attributes.kac.tooltip = [];
        }

        if (data.attributes.cmd) {
            data.attributes.cmd.tooltip = [];
        }

        if (data.attributes.baseAttackBonus) {
            data.attributes.baseAttackBonus.tooltip = [];
        }

        if (data.attributes.fort) {
            data.attributes.fort.tooltip = [];
        }

        if (data.attributes.reflex) {
            data.attributes.reflex.tooltip = [];
        }

        if (data.attributes.will) {
            data.attributes.will.tooltip = [];
        }

        if (data.attributes.speed) {
            data.attributes.speed.tooltip = [];
        }

        if (data.skills) {
            for (const skill of Object.values(data.skills)) {
                skill.tooltip = [];
            }
        }

        if (data.attributes.init) {
            data.attributes.init.tooltip = [];
        }

        if (data.attributes.encumbrance) {
            data.attributes.encumbrance.tooltip = [];
        }

        return fact;
    });
}
