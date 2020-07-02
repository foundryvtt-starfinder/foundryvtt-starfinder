export default async function migrateWorld() {
    const systemVersion = game.system.data.version;
    const systemSchema = Number(game.system.data.schema);
    const worldSchema = game.settings.get('sfrpg', 'worldSchemaVersion') ?? 0;

    ui.notifications.info(game.i18n.format("SFRPG.MigrationBeginingMigration", { systemVersion }), { permanent: true });

    for (const actor of game.actors.entities) {
        try {
            const updateData = migrateActorData(actor.data, worldSchema);
            if (!isObjectEmpty(updateData)) {
                console.log(`SFRPG | Migrating Actor entity ${actor.name}`);
                await actor.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    for (const item of game.items.entities) {
        try {
            const updateData = migrateItemData(item.data, worldSchema);
            if (!isObjectEmpty(updateData)) {
                console.log(`SFRPG | Migrating Item entity ${item.name}`);
                await item.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    game.settings.set('sfrpg', 'worldSchemaVersion', systemSchema);
    ui.notifications.info(game.i18n.format("SFRPG.MigrationEndMigration", { systemVersion }), { permanent: true });
}

const migrateActorData = function (actor, schema) {
    const updateData = {};

    if (schema < SFRPGMigrationSchemas.NPC_DATA_UPATE && actor.type === 'npc') _migrateNPCData(actor, updateData);

    if (schema < SFRPGMigrationSchemas.THE_PAINFUL_UPDATE) {
        _resetActorFlags(actor, updateData);
    }

    return updateData;
};

const migrateItemData = function (item, schema) {
    const updateData = {};
    
    return updateData;
};

const _resetActorFlags = function (actor, data) {
    const actorData = duplicate(actor.data);
    let sfFlags = null;

    if (actor.flags.starfinder) {
        sfFlags = duplicate(actor.flags.starfinder);
    }

    data["flags.-=starfinder"] = null;
    data["flags.sfrpg"] = sfFlags;

    return data;
}

const _migrateNPCData = function (actor, data) {
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

    data['data.abilities'] = abilities;
    data['data.skills'] = skills;

    return data;
};

const SFRPGMigrationSchemas = Object.freeze({
    NPC_DATA_UPATE: 0.001,
    THE_PAINFUL_UPDATE: 0.002
});