export default function (engine) {
    engine.closures.add("setupActorRollContexts", (fact, context) => {
        const actor = fact.actor;
        const rollContext = actor.rollContext;
        const data = fact.data;
        const type = fact.type;

        rollContext.addContext("main", actor, data);
        rollContext.setMainContext("main");

        if (type === "vehicle") {
            rollContext.addContext("vehicle", actor, data);
        }

        if (type === "starship") {
            rollContext.addContext("ship", actor, data);
        }

        actor.setupRollContexts(rollContext);

        return fact;
    });
}