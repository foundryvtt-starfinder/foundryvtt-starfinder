export default function (engine) {
    const getCRExp = cr => {
        if (cr < 1.0) {
            if (cr === (1/3)) {
                return 135;
            } else if (cr === (1/6)) {
                return 65;
            }

            return Math.max(400 * cr, 50);
        }

        return CONFIG.SFRPG.CR_EXP_LEVELS[cr];
    };

    engine.closures.add("calculateNpcXp", (fact, context) => {
        fact.data.details.xp.value = getCRExp(fact.data.details.cr);

        return fact;
    });
}