import { SFRPGModifierTypes, SFRPGEffectType, SFRPGModifierType } from "./modifiers/types.js";
import SFRPGModifier from "./modifiers/modifier.js";

const SFRPGMigrationSchemas = Object.freeze({
    NPC_DATA_UPATE: 0.001,
    THE_PAINFUL_UPDATE: 0.002, // Due to copyright concerns, all references to Starfinder were renamed to SFRPG
    THE_HAPPY_UPDATE: 0.003, // Due to Paizo clarifying their stance, most references to SFRPG were returned to Starfinder
    THE_ACTOR_SPEED_UPDATE: 0.004,
    DAMAGE_TYPE_REFACTOR: 0.005,
    DAMAGE_REDUCTION_REFACTOR: 0.006,
    THE_WEBP_UPDATE: 0.008, // We changed all icons from .png to .webp
    THE_GUNNERY_UPDATE: 0.009, // Since Gunnery is now a selectable skill for NPC starships, migrate an NPC gunner's ranks in Piloting (the previous hacky solution) to their modifier in Gunnery.
    THE_PROPERTIES_UPDATE: 0.010 // Updates the "properties" data for weapons to include nesting for variability such as in Explode (5ft)
});

// Allows for migration to be enabled and disabled while doing development
const performMigrate = false;

export default async function migrateWorld() {
    const systemVersion = game.system.version;
    const worldSchema = game.settings.get('sfrpg', 'worldSchemaVersion') ?? 0;

    ui.notifications.info(game.i18n.format("SFRPG.MigrationBeginingMigration", { systemVersion }), { permanent: true });

    if (!performMigrate) {
        ui.notifications.warn("Migration functions are currently disabled for testing. Remove this before release.", { permanent: true });
    }

    if (performMigrate) {
        for (const actor of game.actors) {
            try {
                const updateData = await migrateActor(actor, worldSchema);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`Starfinder | Migrating Actor entity ${actor.name}`);
                    await actor.update(updateData, { enforceTypes: false });
                }
            } catch (err) {
                console.error(err);
            }
        }

        for (const item of game.items) {
            try {
                const updateData = await migrateItem(item, worldSchema);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`Starfinder | Migrating Item entity ${item.name}`);
                    await item.update(updateData, { enforceTypes: false });
                }
            } catch (err) {
                console.error(err);
            }
        }

        for (const message of game.messages) {
            try {
                const updateData = await migrateChatMessage(message, worldSchema);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`Starfinder | Migrating Chat message entity ${message.id}`);
                    await message.update(updateData, { enforceTypes: false });
                }
            } catch (err) {
                console.error(err);
            }
        }

        for (const macro of game.macros) {
            try {
                const updateData = await migrateMacro(macro, worldSchema);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`Starfinder | Migrating Macro entity ${macro.name}`);
                    await macro.update(updateData, { enforceTypes: false });
                }
            } catch (err) {
                console.error(err);
            }
        }

        // Migrate Actors and Items in compendiums
        for (const pack of game.packs) {
            if (pack.metadata.packageType === "world") {
                const wasLocked = pack.locked;
                // Unlock pack if needed
                if (pack.locked) {
                    pack.configure({locked: false});
                }

                if (worldSchema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) {
                    if (pack.metadata.type === "Actor") {
                        await pack.updateAll(migrateCompendiumActorToWebP);
                    } else if (pack.metadata.type === "Item") {
                        await pack.updateAll(migrateCompendiumItemToWebP);
                    }
                }

                if (worldSchema < SFRPGMigrationSchemas.THE_PROPERTIES_UPDATE) {
                    if (pack.metadata.type === "Actor") {
                        const documents = await pack.getDocuments();
                        for (const doc of documents) {
                            await doc.update(await migrateActor(doc, worldSchema), { enforceTypes: false });
                        }
                    } else if (pack.metadata.type === "Item") {
                        const documents = await pack.getDocuments();
                        for (const doc of documents) {
                            await doc.update(await migrateItem(doc, worldSchema), { enforceTypes: false });
                        }
                    }
                }

                // Lock pack if it was locked.
                if (wasLocked) {
                    pack.configure({locked: true});
                }
            }
        }

        const systemSchema = Number(game.system.flags.sfrpg.schema);
        await game.settings.set('sfrpg', 'worldSchemaVersion', systemSchema);
        ui.notifications.info(game.i18n.format("SFRPG.MigrationEndMigration", { systemVersion }), { permanent: true });
    }

    if (worldSchema < SFRPGMigrationSchemas.THE_PROPERTIES_UPDATE) {
        return true;
    }

    return false;
}

const migrateItem = async function(item, schema) {
    const updateData = {};

    if (schema < SFRPGMigrationSchemas.DAMAGE_TYPE_REFACTOR) _migrateDamageTypes(item, updateData);
    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) _migrateDocumentIconToWebP(item, updateData);
    if (schema < SFRPGMigrationSchemas.THE_PROPERTIES_UPDATE) _migrateProperties(item, updateData);

    return updateData;
};

const migrateCompendiumItemToWebP = async function(itemDocument) {
    return await migrateItem(itemDocument, SFRPGMigrationSchemas.THE_WEBP_UPDATE - 0.001);
};

const migrateActor = async function(actor, schema) {
    const updateData = {};
    const speedActorTypes = ['character', 'npc', 'npc2', 'drone'];

    if (schema < SFRPGMigrationSchemas.NPC_DATA_UPATE && actor.type === 'npc') { _migrateNPCData(actor, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_PAINFUL_UPDATE) { _resetActorFlags(actor, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_HAPPY_UPDATE && actor.type === 'character') { _migrateActorAbilityScores(actor, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_ACTOR_SPEED_UPDATE && speedActorTypes.includes(actor.type)) { _migrateActorSpeed(actor, updateData); }
    if (schema < SFRPGMigrationSchemas.DAMAGE_REDUCTION_REFACTOR) { _migrateActorDamageReductions(actor, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) { _migrateDocumentIconToWebP(actor, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_GUNNERY_UPDATE && actor.type === 'starship' && actor.system.crew.useNPCCrew) { _migrateStarshipGunnerySkill(actor, updateData); }

    for (const item of actor.items) {
        const itemUpdateData = await migrateItem(item, schema);
        if (!foundry.utils.isEmpty(itemUpdateData)) {
            console.log(`Starfinder | Migrating Actor Item ${item.name}`);
            await item.update(itemUpdateData, { enforceTypes: false });
        }
    }

    return updateData;
};

const migrateCompendiumActorToWebP = async function(actorDocument) {
    return await migrateActor(actorDocument, SFRPGMigrationSchemas.THE_WEBP_UPDATE - 0.001);
};

const migrateToken = async function(token, schema) {
    const updateData = {};
    const tokenData = token.data;

    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) {
        _migrateDocumentIconToWebP(tokenData, updateData);

        if (tokenData.flags.sfrpg?.itemCollection) {
            try {
                const flatCollection = JSON.stringify(tokenData.flags.sfrpg.itemCollection);
                const convertedCollection = _migrateStringContentToWebP(flatCollection);
                const jsonCollection = JSON.parse(convertedCollection);
                updateData['flags.sfrpg.itemCollection'] = jsonCollection;
            } catch {
                console.log(`Failed to convert items for ${token.name} in scene ${token.scene.name}`);
            }
        }
    }

    const actor = token.actor;
    if (!token.data.actorLink && actor) {
        const actorUpdateData = await migrateActor(actor, schema);
        if (!foundry.utils.isEmpty(actorUpdateData)) {
            console.log(`Starfinder | Migrating Token Actor ${actor.name}`);
            await actor.update(actorUpdateData, { enforceTypes: false });
        }
    }

    return updateData;
};

const migrateChatMessage = async function(message, schema) {
    const updateData = {};

    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) _migrateChatMessageContentToWebP(message, updateData);

    return updateData;
};

const migrateMacro = async function(macro, schema) {
    const updateData = {};

    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) _migrateDocumentIconToWebP(macro, updateData);

    return updateData;
};

const damageTypeMigrationCallback = function(arr, curr) {
    if (!Array.isArray(curr)) return arr;
    let [formula, type] = curr;

    if (!type) {
        arr.push({ "formula": formula || "", "types": {}, "operator": "" });
    } else if (type.includes("+")) {
        let types = type.split("+");
        arr.push({ "formula": formula, "types": { [types[0]]: true, [types[1]]: true }, "operator": "and" });
    } else if (type.includes("|")) {
        let types = type.split("|");
        arr.push({ "formula": formula, "types": { [types[0]]: true, [types[1]]: true }, "operator": "or" });
    } else {
        arr.push({ "formula": formula, "types": { [type]: true }, "operator": "" });
    }

    return arr;
};

const _migrateDamageTypes = function(item, data) {
    const itemData = foundry.utils.duplicate(item);
    const damage = itemData.damage;
    const critical = itemData.critical;

    if (damage?.parts?.length > 0) {
        let parts = damage.parts.reduce(damageTypeMigrationCallback, []);

        data['data.damage.parts'] = parts;
    }

    if (critical?.parts?.length > 0) {
        let parts = critical.parts.reduce(damageTypeMigrationCallback, []);

        data['data.critical.parts'] = parts;
    }

    return data;
};

const _migrateNPCData = function(actor, migratedData) {
    const actorData = duplicate(actor);
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

const _resetActorFlags = function(actor, migratedData) {
    const actorData = duplicate(actor);
    let sfFlags = null;

    if (actor.flags.starfinder) {
        sfFlags = duplicate(actor.flags.starfinder);
    }

    migratedData["flags.-=starfinder"] = null;
    migratedData["flags.sfrpg"] = sfFlags;

    return migratedData;
};

const _migrateActorAbilityScores = function(actor, migratedData) {
    const actorData = duplicate(actor);
    const abilities = actorData.abilities;

    for (const ability of Object.values(abilities)) {
        ability.base = ability.value || 10;
    }

    migratedData["data.abilities"] = abilities;

    return migratedData;
};

const _migrateActorSpeed = function(actor, migratedData) {

    const speedValue = actor.attributes.speed?.value;

    let baseSpeed = duplicate(speedValue);
    if (baseSpeed && isNaN(baseSpeed)) {
        baseSpeed = baseSpeed.replace(/\D/g, '');
        baseSpeed = Number(baseSpeed);
    }

    // If all else fails, forcibly reset it to 30.
    if (!baseSpeed || isNaN(baseSpeed)) {
        baseSpeed = 30;
    }

    const speed = {
        land: { base: 0 },
        flying: { base: 0 },
        swimming: { base: 0 },
        burrowing: { base: 0 },
        climbing: { base: 0 },
        special: actor.attributes.speed.special,
        mainMovement: "land"
    };

    const lowercaseSpeedValue = ("" + speedValue || "").toLowerCase();
    if (lowercaseSpeedValue.includes("climb")) {
        speed.climbing.base = baseSpeed;
        speed.mainMovement = "climbing";
    } else if (lowercaseSpeedValue.includes("fly")) {
        speed.flying.base = baseSpeed;
        speed.mainMovement = "flying";
    } else if (lowercaseSpeedValue.includes("burrow")) {
        speed.burrowing.base = baseSpeed;
        speed.mainMovement = "burrowing";
    } else if (lowercaseSpeedValue.includes("swim")) {
        speed.swimming.base = baseSpeed;
        speed.mainMovement = "swimming";
    } else {
        speed.land.base = baseSpeed;
        speed.mainMovement = "land";
    }

    migratedData["data.attributes.speed"] = speed;

    return migratedData;
};

// ================== 0.006: Damage Mitigation ==================
const _migrateActorDamageReductions = function(actor, migratedData) {

    const modifiers = duplicate(migratedData.modifiers ?? actor.modifiers ?? []);
    let isDirty = false;

    // Process old damage reduction
    if (actor.traits?.damageReduction) {
        const oldDamageReduction = duplicate(actor.traits.damageReduction);
        const oldDamageReductionValue = Number(oldDamageReduction.value);
        if (!Number.isNaN(oldDamageReductionValue) && oldDamageReductionValue > 0) {
            let notes = "";
            if (!oldDamageReduction.negatedBy || oldDamageReduction.negatedBy != "-") {
                notes = oldDamageReduction.negatedBy;
            }

            const damageReductionModifier = new SFRPGModifier({
                name: "Damage Reduction",
                modifier: oldDamageReductionValue,
                type: SFRPGModifierTypes.UNTYPED,
                modifierType: SFRPGModifierType.CONSTANT,
                effectType: SFRPGEffectType.DAMAGE_REDUCTION,
                valueAffected: "",
                enabled: true,
                source: "Migration",
                notes: notes,
                subtab: "permanent",
                condition: "",
                id: null // Auto-generate
            });

            modifiers.push(damageReductionModifier);

            migratedData["data.traits.damageReduction"] = {value: 0, negatedBy: ""};
            isDirty = true;
            console.log("> Migrated damage reduction.");
        }
    }

    // Process old energy resistances
    const customEnergyResistances = actor.traits?.dr?.custom;
    const oldEnergyResistances = Object.entries(actor.traits?.dr?.value ?? []);
    if (oldEnergyResistances.length > 0 || customEnergyResistances) {
        if (oldEnergyResistances.length > 0) {
            for (const [index, entries] of oldEnergyResistances) {
                for (const [key, value] of Object.entries(entries)) {
                    const resistanceValue = Number(value);
                    if (Number.isNaN(resistanceValue)) {
                        continue;
                    }

                    const energyResistanceModifier = new SFRPGModifier({
                        name: "Energy Resistance",
                        modifier: resistanceValue,
                        type: SFRPGModifierTypes.UNTYPED,
                        modifierType: SFRPGModifierType.CONSTANT,
                        effectType: SFRPGEffectType.ENERGY_RESISTANCE,
                        valueAffected: key,
                        enabled: true,
                        source: "Migration",
                        notes: "",
                        subtab: "permanent",
                        condition: "",
                        id: null // Auto-generate
                    });
                    modifiers.push(energyResistanceModifier);
                }
            }
        }

        if (customEnergyResistances) {
            const customResistances = customEnergyResistances.trim().split(';');
            for (const customResistance of customResistances) {
                const customSplit = customResistance.trim().split(' ');
                if (customSplit.length == 2) {
                    const notes = customSplit[0];
                    const resistanceValue = Number(customSplit[1]);

                    if (Number.isNaN(resistanceValue)) {
                        continue;
                    }

                    const energyResistanceModifier = new SFRPGModifier({
                        name: "Energy Resistance",
                        modifier: resistanceValue,
                        type: SFRPGModifierTypes.UNTYPED,
                        modifierType: SFRPGModifierType.CONSTANT,
                        effectType: SFRPGEffectType.ENERGY_RESISTANCE,
                        valueAffected: "custom",
                        enabled: true,
                        source: "Migration",
                        notes: notes,
                        subtab: "permanent",
                        condition: "",
                        id: null // Auto-generate
                    });
                    modifiers.push(energyResistanceModifier);
                }
            }
        }

        migratedData["data.traits.dr"] = {value: [], custom: ""};
        isDirty = true;
        console.log("> Migrated energy resistances.");
    }

    if (isDirty) {
        migratedData["data.modifiers"] = modifiers;
    }

    return migratedData;
};

// ================== 0.008: WebP Conversion ==================
function _imageNeedsReplace(imagePath) {
    const fileTypes = [".png", ".PNG", ".jpg", ".JPG", ".jpeg", ".JPEG"];
    for (const fileType of fileTypes) {
        if (imagePath?.endsWith(fileType)) {
            if (imagePath?.includes("systems/sfrpg/")) {
                return fileType;
            }
        }
    }
    return null;
}

// Any reference to a .png or .jpg in systems/sfrpg/ should be replaced with a link to a .webp with the same name
const _migrateDocumentIconToWebP = function(document, data) {
    const imageType = _imageNeedsReplace(document.img);
    if (imageType) {
        data["img"] = document.img.replace(imageType, ".webp");
    }

    const fullBodyImageType = _imageNeedsReplace(document.system?.details?.biography?.fullBodyImage);
    if (fullBodyImageType) {
        data["system.details.biography.fullBodyImage"] = document.system?.details?.biography?.fullBodyImage.replace(fullBodyImageType, ".webp");
    }

    if (document.system?.combatTracker?.visualization?.length > 0) {
        const newVisualization = duplicate(document.system.combatTracker.visualization);
        let isDirty = false;

        for (const [key, visualization] of Object.entries(newVisualization)) {
            const visualizationImageType = _imageNeedsReplace(visualization.image);
            if (visualizationImageType) {
                visualization.image = visualization.image.replace(visualizationImageType, ".webp");
                isDirty = true;
            }
        }

        if (isDirty) {
            data["system.combatTracker.visualization"] = newVisualization;
        }
    }

    if (document.system?.description?.value) {
        const description = _migrateStringContentToWebP(document.system.description.value);
        if (document.system.description.value != description) {
            data["system.description.value"] = description;
        }
    }

    return data;
};

const _migrateChatMessageContentToWebP = function(messageData, data) {

    if (messageData?.content) {
        const content = _migrateStringContentToWebP(messageData.content);
        if (messageData.content != content) {
            data["content"] = content;
        }
    }

    return data;
};

const _migrateStringContentToWebP = function(string) {
    string = duplicate(string);
    string = string.replace(/(systems\/sfrpg\/[^"]*).png/gi, "$1.webp");
    string = string.replace(/(systems\/sfrpg\/[^"]*).jpg/gi, "$1.webp");
    return string;
};

// ================== 0.009: Starship Gunnery Conversion ==================
const _migrateStarshipGunnerySkill = function(actor, updateData) {
    const pilRanks = actor.system.crew.npcData.gunner.skills.pil.ranks;
    if (pilRanks) {
        updateData['system.crew.npcData.gunner.skills.gun.mod'] = pilRanks;
        updateData['system.crew.npcData.gunner.skills.-=pil'] = null;
    }

    return updateData;
};

// ================== 0.010: Weapon Properties ==================
const _migrateProperties = function(itemData, updateData) {
    const properties = itemData.system.properties;
    if (properties) {
        // console.log(`${itemData.name} has properties to migrate.`);
        for (const [key, value] of Object.entries(properties)) {
            updateData[`system.properties.${key}.value`] = value;
            updateData[`system.properties.${key}.extension`] = '';
        }
    } else {
        // console.log(`${itemData.name} is fine.`);
    }

    return updateData;
};

const migrateCompendiumItem = async function(itemDocument) {
    // console.log(itemDocument);
    return await migrateItem(itemDocument, SFRPGMigrationSchemas.THE_WEBP_UPDATE - 0.001);
};

const migrateCompendiumActor = async function(actorDocument) {
    return await migrateActor(actorDocument, SFRPGMigrationSchemas.THE_WEBP_UPDATE - 0.001);
};
