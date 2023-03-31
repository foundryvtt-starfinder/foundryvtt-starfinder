import SFRPGModifier from "./modifiers/modifier.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "./modifiers/types.js";

const SFRPGMigrationSchemas = Object.freeze({
    NPC_DATA_UPATE: 0.001,
    THE_PAINFUL_UPDATE: 0.002, // Due to copyright concerns, all references to Starfinder were renamed to SFRPG
    THE_HAPPY_UPDATE: 0.003, // Due to Paizo clarifying their stance, most references to SFRPG were returned to Starfinder
    THE_ACTOR_SPEED_UPDATE: 0.004,
    DAMAGE_TYPE_REFACTOR: 0.005,
    DAMAGE_REDUCTION_REFACTOR: 0.006,
    THE_WEBP_UPDATE: 0.008, // We changed all icons from .png to .webp
    THE_GUNNERY_UPDATE: 0.009 // Since Gunnery is now a selectable skill for NPC starships, migrate an NPC gunner's ranks in Piloting (the previous hacky solution) to their modifier in Gunnery.
});

export default async function migrateWorld() {
    const systemVersion = game.system.data.version;
    const worldSchema = game.settings.get('sfrpg', 'worldSchemaVersion') ?? 0;

    ui.notifications.info(game.i18n.format("SFRPG.MigrationBeginingMigration", { systemVersion }), { permanent: true });

    for (const actor of game.actors.contents) {
        try {
            const updateData = await migrateActor(actor, worldSchema);
            if (!isEmpty(updateData)) {
                console.log(`Starfinder | Migrating Actor entity ${actor.name}`);
                await actor.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    for (const scene of game.scenes) {
        for (const token of scene.tokens) {
            try {
                const tokenUpdateData = await migrateToken(token, worldSchema);
                if (!isEmpty(tokenUpdateData)) {
                    console.log(`Starfinder | Migrating Token entity ${token.name}`);
                    await token.update(tokenUpdateData, { enforceTypes: false });
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    for (const item of game.items.contents) {
        try {
            const updateData = await migrateItem(item, worldSchema);
            if (!isEmpty(updateData)) {
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
            if (!isEmpty(updateData)) {
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
            if (!isEmpty(updateData)) {
                console.log(`Starfinder | Migrating Macro entity ${macro.name}`);
                await macro.update(updateData, { enforceTypes: false });
            }
        } catch (err) {
            console.error(err);
        }
    }

    for (const pack of game.packs) {
        if (pack.collection.startsWith("world")) {
            const wasLocked = pack.locked;
            // Unlock pack if needed
            if (pack.locked) {
                pack.configure({locked: false});
            }

            if (worldSchema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) {
                if (pack.documentName === "Actor") {
                    await pack.updateAll(migrateCompendiumActorToWebP);
                } else if (pack.documentName === "Item") {
                    await pack.updateAll(migrateCompendiumItemToWebP);
                }
            }

            // Lock pack if it was locked.
            if (wasLocked) {
                pack.configure({locked: true});
            }
        }
    }

    const systemSchema = Number(game.system.data.flags.sfrpg.schema);
    await game.settings.set('sfrpg', 'worldSchemaVersion', systemSchema);
    ui.notifications.info(game.i18n.format("SFRPG.MigrationEndMigration", { systemVersion }), { permanent: true });

    if (worldSchema < SFRPGMigrationSchemas.THE_GUNNERY_UPDATE) {
        return true;
    }

    return false;
}

const migrateItem = async function(item, schema) {
    const updateData = {};
    const itemData = item.data;

    if (schema < SFRPGMigrationSchemas.DAMAGE_TYPE_REFACTOR) _migrateDamageTypes(itemData, updateData);
    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) _migrateDocumentIconToWebP(itemData, updateData);

    return updateData;
};

const migrateCompendiumItemToWebP = async function(itemDocument) {
    return await migrateItem(itemDocument, SFRPGMigrationSchemas.THE_WEBP_UPDATE - 0.001);
};

const migrateActor = async function(actor, schema) {
    const updateData = {};
    const speedActorTypes = ['character', 'npc', 'npc2', 'drone'];
    const actorData = actor.data;

    if (schema < SFRPGMigrationSchemas.NPC_DATA_UPATE && actorData.type === 'npc') { _migrateNPCData(actorData, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_PAINFUL_UPDATE) { _resetActorFlags(actorData, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_HAPPY_UPDATE && actorData.type === 'character') { _migrateActorAbilityScores(actorData, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_ACTOR_SPEED_UPDATE && speedActorTypes.includes(actorData.type)) { _migrateActorSpeed(actorData, updateData); }
    if (schema < SFRPGMigrationSchemas.DAMAGE_REDUCTION_REFACTOR) { _migrateActorDamageReductions(actorData, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) { _migrateDocumentIconToWebP(actorData, updateData); }
    if (schema < SFRPGMigrationSchemas.THE_GUNNERY_UPDATE && actorData.type === 'starship' && actorData.data.crew.useNPCCrew) { _migrateStarshipGunnerySkill(actorData, updateData); }

    for (const item of actor.items) {
        const itemUpdateData = await migrateItem(item, schema);
        if (!isEmpty(itemUpdateData)) {
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
        if (!isEmpty(actorUpdateData)) {
            console.log(`Starfinder | Migrating Token Actor ${actor.name}`);
            await actor.update(actorUpdateData, { enforceTypes: false });
        }
    }

    return updateData;
};

const migrateChatMessage = async function(message, schema) {
    const updateData = {};
    const messageData = message.data;

    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) _migrateChatMessageContentToWebP(messageData, updateData);

    return updateData;
};

const migrateMacro = async function(macro, schema) {
    const updateData = {};
    const macroData = macro.data;

    if (schema < SFRPGMigrationSchemas.THE_WEBP_UPDATE) _migrateDocumentIconToWebP(macroData, updateData);

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
    const itemData = deepClone(item.data);
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
    const actorData = deepClone(actor.data);
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
    const actorData = deepClone(actor.data);
    let sfFlags = null;

    if (actor.flags.starfinder) {
        sfFlags = deepClone(actor.flags.starfinder);
    }

    migratedData["flags.-=starfinder"] = null;
    migratedData["flags.sfrpg"] = sfFlags;

    return migratedData;
};

const _migrateActorAbilityScores = function(actor, migratedData) {
    const actorData = deepClone(actor.data);
    const abilities = actorData.abilities;

    for (const ability of Object.values(abilities)) {
        ability.base = ability.value || 10;
    }

    migratedData["data.abilities"] = abilities;

    return migratedData;
};

const _migrateActorSpeed = function(actor, migratedData) {
    const actorData = actor.data;

    const speedValue = actorData.attributes.speed?.value;

    let baseSpeed = deepClone(speedValue);
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
        special: actorData.attributes.speed.special,
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
    const actorData = actor.data;

    const modifiers = deepClone(migratedData.modifiers ?? actorData.modifiers ?? []);
    let isDirty = false;

    // Process old damage reduction
    if (actorData.traits?.damageReduction) {
        const oldDamageReduction = deepClone(actorData.traits.damageReduction);
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
    const customEnergyResistances = actorData.traits?.dr?.custom;
    const oldEnergyResistances = Object.entries(actorData.traits?.dr?.value ?? []);
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

    const fullBodyImageType = _imageNeedsReplace(document.data?.details?.biography?.fullBodyImage);
    if (fullBodyImageType) {
        data["data.details.biography.fullBodyImage"] = document.data?.details?.biography?.fullBodyImage.replace(fullBodyImageType, ".webp");
    }

    if (document.data?.combatTracker?.visualization?.length > 0) {
        const newVisualization = deepClone(document.data.combatTracker.visualization);
        let isDirty = false;

        for (const [key, visualization] of Object.entries(newVisualization)) {
            const visualizationImageType = _imageNeedsReplace(visualization.image);
            if (visualizationImageType) {
                visualization.image = visualization.image.replace(visualizationImageType, ".webp");
                isDirty = true;
            }
        }

        if (isDirty) {
            data["data.combatTracker.visualization"] = newVisualization;
        }
    }

    if (document.data?.description?.value) {
        const description = _migrateStringContentToWebP(document.data.description.value);
        if (document.data.description.value != description) {
            data["data.description.value"] = description;
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
    string = deepClone(string);
    string = string.replace(/(systems\/sfrpg\/[^"]*).png/gi, "$1.webp");
    string = string.replace(/(systems\/sfrpg\/[^"]*).jpg/gi, "$1.webp");
    return string;
};

// ================== 0.009: Starship Gunnery Conversion ==================
const _migrateStarshipGunnerySkill = function(actorData, updateData) {
    const pilRanks = actorData.data.crew.npcData.gunner.skills.pil.ranks;
    if (pilRanks) {
        updateData['data.crew.npcData.gunner.skills.gun.mod'] = pilRanks;
        updateData['data.crew.npcData.gunner.skills.-=pil'] = null;
    }

    return updateData;
};
