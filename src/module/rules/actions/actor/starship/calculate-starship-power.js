export default function(engine) {
    engine.closures.add("calculateStarshipPower", (fact, context) => {
        const data = fact.data;

        data.attributes.power.value = 0;
        data.attributes.power.max = 0;

        /** Compute max power. */
        const powerCores = fact.items.filter(x => x.type === "starshipPowerCore");
        for (const powerCore of powerCores) {
            data.attributes.power.max += powerCore.system.pcu;
        }

        /** Compute power use. */
        const starshipComponents = fact.items.filter(x => x.type.startsWith("starship"));
        for (const component of starshipComponents) {
            const componentData = component.system;

            const excludedComponents = ["starshipFrame", "starshipPowerCore"];
            if (!excludedComponents.includes(component.type)) {
                if (componentData.pcu && componentData.isPowered) {
                    data.attributes.power.value += componentData.pcu;
                    data.attributes.power.tooltip.push(`${component.name}: ${componentData.pcu}`);
                }
            }
        }

        return fact;
    });
}
