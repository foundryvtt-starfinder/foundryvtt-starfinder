export default function (engine) {
    engine.closures.add("calculateStarshipSpeed", (fact, context) => {
        const data = fact.data;

        data.attributes.speed.value = 0;

        const thrusters = fact.items.filter(x => x.type === "starshipThruster");
        for (const thruster of thrusters) {
            const thrusterData = thruster.data.data;

            if (!thrusterData.isBooster) {
                data.attributes.speed.value += thrusterData.speed;
                data.attributes.speed.tooltip.push(`${thruster.name}: ${thrusterData.speed.signedString()}`);

                data.attributes.pilotingBonus.value += thrusterData.pilotingModifier;
                data.attributes.pilotingBonus.tooltip.push(`${thruster.name}: ${thrusterData.pilotingModifier.signedString()}`);
            } else if (thrusterData.isEnabled) {
                data.attributes.speed.value += Math.floor(thrusterData.speed / 4);
                data.attributes.speed.tooltip.push(`${thruster.name}: ${thrusterData.speed.signedString()}`);
            }
        }

        return fact;
    });
}