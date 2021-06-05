const SFRPGActorMigrationSchemas = Object.freeze({
    NPC_DATA_UPATE: 0.001,
    THE_PAINFUL_UPDATE: 0.002, // Due to copyright concerns, all references to Starfinder were renamed to SFRPG
    THE_HAPPY_UPDATE: 0.003, // Due to Paizo clarifying their stance, most references to SFRPG were returned to Starfinder
    THE_ACTOR_SPEED_UPDATE: 0.004
});

export default async function migrateWorld() {
    const systemVersion = game.system.data.version;
    const systemSchema = Number(game.system.data.flags.sfrpg.schema);
    const worldSchema = game.settings.get('sfrpg', 'worldSchemaVersion') ?? 0;

    ui.notifications.info(game.i18n.format("SFRPG.MigrationBeginingMigration", { systemVersion }), { permanent: true });

    for (const actor of game.actors.contents) {
        try {
            const updateData = migrateActorData(actor.data, worldSchema);
            if (!isObjectEmpty(updateData)) {
                console.log(`Starfinder | Migrating Actor entity ${actor.name}`);
                await actor.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    for (const item of game.items.contents) {
        try {
            const updateData = migrateItemData(item.data, worldSchema);
            if (!isObjectEmpty(updateData)) {
                console.log(`Starfinder | Migrating Item entity ${item.name}`);
                await item.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    game.settings.set('sfrpg', 'worldSchemaVersion', 0.003);
    ui.notifications.info(game.i18n.format("SFRPG.MigrationEndMigration", { systemVersion }), { permanent: true });
}

const migrateItemData = function (item, schema) {
    const updateData = {};
    
    return updateData;
};

const migrateActorData = function (actor, schema) {
    const updateData = {};

    const speedActorTypes = ['character', 'npc', 'drone'];

    if (schema < SFRPGActorMigrationSchemas.NPC_DATA_UPATE && actor.type === 'npc') _migrateNPCData(actor, updateData);
    if (schema < SFRPGActorMigrationSchemas.THE_PAINFUL_UPDATE) _resetActorFlags(actor, updateData);
    if (schema < SFRPGActorMigrationSchemas.THE_HAPPY_UPDATE && actor.type === 'character') _migrateActorAbilityScores(actor, updateData);
    if (schema < SFRPGActorMigrationSchemas.THE_ACTOR_SPEED_UPDATE && speedActorTypes.includes(actor.type)) _migrateActorSpeed(actor, updateData);

    return updateData;
};

const _migrateNPCData = function (actor, migratedData) {
    const actorData = duplicate(actor.data);
    const abilities = actorData.abilities;
    const skills = actorData.skills;

    for (const ability of Object.values(abilities)) {
        if (ability.value)
            ability.mod = Math.floor((ability.value - 10) / 2);
        else ability.mod = 0;
    }

    for (const skill of Object.values(skills)) {
        skill.mod = skill.ranks + skill.misc + actorData.abilities[skill.ability].mod;

        if (skill.misc && skill.misc > 0) skill.enabled = true;
    }

    migratedData['data.abilities'] = abilities;
    migratedData['data.skills'] = skills;

    return migratedData;
};

const _resetActorFlags = function (actor, migratedData) {
    const actorData = duplicate(actor.data);
    let sfFlags = null;

    if (actor.flags.starfinder) {
        sfFlags = duplicate(actor.flags.starfinder);
    }

    migratedData["flags.-=starfinder"] = null;
    migratedData["flags.sfrpg"] = sfFlags;

    return migratedData;
}

const _migrateActorAbilityScores = function (actor, migratedData) {
    const actorData = duplicate(actor.data);
    const abilities = actorData.abilities;

    for (const ability of Object.values(abilities)) {
        ability.base = ability.value || 10;
    }

    migratedData["data.abilities"] = abilities;

    return migratedData;
};

const _migrateActorSpeed = function (actor, migratedData) {
    const actorData = actor.data;

    let baseSpeed = actorData.attributes.speed?.value;
    if (baseSpeed) {
        baseSpeed = baseSpeed.replace(/\D/g,'');
    }

    const speed = {
        ground: { base: baseSpeed ?? 30, value: 0 },
        flying: { base: 0, value: 0 },
        swimming: { base: 0, value: 0 },
        burrowing: { base: 0, value: 0 },
        climb: { base: 0, value: 0 },
        value: actorData.attributes.speed.value, // TODO: Remove this line when done reprogramming speed
        special: actorData.attributes.speed.special
    };

    migratedData["data.attributes.speed"] = speed;
    console.log([actorData, migratedData]);

    return migratedData;
};
