export default function (engine) {
    const getLevelExp = (level) => {
        const levels = CONFIG.SFRPG.CHARACTER_EXP_LEVELS;
        return levels[Math.min(level, levels.length - 1)];
    };

    engine.closures.add("calculateXP", (fact, context) => {
        const data = fact.data;
        const level = parseInt(data.details.level.value);
        
        data.details.xp.max = getLevelExp(level || 1);
        let prior = getLevelExp(level - 1 || 0),
            req = data.details.xp.max - prior;
        
        data.details.xp.pct = Math.min(Math.round((data.details.xp.value - prior) * 100 / req), 99.5);

        return fact;
    });
}