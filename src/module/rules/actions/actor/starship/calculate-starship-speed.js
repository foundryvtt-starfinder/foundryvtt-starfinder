export default function (engine) {
    engine.closures.add("calculateStarshipSpeed", (fact, context) => {
        const data = fact.data;

        data.attributes.speed.value = 0;

        const thrusters = fact.items.filter(x => x.type === "starshipThruster");
        for (const thruster of thrusters) {
            if (!thruster.data.isBooster) {
                data.attributes.speed.value += thruster.data.speed;
                data.attributes.speed.tooltip.push(`${thruster.name}: ${thruster.data.speed.signedString()}`);

                data.attributes.pilotingBonus.value += thruster.data.pilotingModifier;
                data.attributes.pilotingBonus.tooltip.push(`${thruster.name}: ${thruster.data.pilotingModifier.signedString()}`);
            } else if (thruster.data.isEnabled) {
                data.attributes.speed.value += Math.floor(thruster.data.speed / 4);
                data.attributes.speed.tooltip.push(`${thruster.name}: ${thruster.data.speed.signedString()}`);
            }
        }

        return fact;
    });
}