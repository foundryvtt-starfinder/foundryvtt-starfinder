export default function (engine) {
    engine.closures.add("calculateStarshipTargetLock", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        const pilot = (actor.crew?.pilot?.actors) ? actor.crew?.pilot?.actors[0] : null;
        const sizeMod = CONFIG.SFRPG.starshipSizeMod[data.details.size] || 0;

        let pilotingRanks = pilot?.system?.skills?.pil?.ranks || 0;
        if (data.crew.useNPCCrew) {
            pilotingRanks = data.crew.npcData?.pilot?.skills?.pil?.ranks || 0;
        }
        
        /** Set up base values. */
        const forwardTL = duplicate(data.quadrants.forward.targetLock);
        data.quadrants.forward.targetLock = {
            value: 10,
            misc: (forwardTL?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const portTL = duplicate(data.quadrants.port.targetLock);
        data.quadrants.port.targetLock = {
            value: 10,
            misc: (portTL?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const starboardTL = duplicate(data.quadrants.starboard.targetLock);
        data.quadrants.starboard.targetLock = {
            value: 10,
            misc: (starboardTL?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const aftTL = duplicate(data.quadrants.aft.targetLock);
        data.quadrants.aft.targetLock = {
            value: 10,
            misc: (aftTL?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        /** Get modifying items. */
        let defensiveCountermeasureItem = null;
        const defensiveCountermeasureItems = fact.items.filter(x => x.type === "starshipDefensiveCountermeasure");
        if (defensiveCountermeasureItems && defensiveCountermeasureItems.length > 0) {
            defensiveCountermeasureItem = defensiveCountermeasureItems[0];
        }

        const ablativeArmorItems = fact.items.filter(x => x.type === "starshipAblativeArmor");
        let ablativeArmorItem = null;
        if (ablativeArmorItems && ablativeArmorItems.length > 0) {
            ablativeArmorItem = ablativeArmorItems[0];
        }

        const armorItems = fact.items.filter(x => x.type === "starshipArmor");
        let armorItem = null;
        if (armorItems && armorItems.length > 0) {
            armorItem = armorItems[0];
        }

        const shieldItems = fact.items.filter(x => x.type === "starshipShield");
        let shieldItem = null;
        if (shieldItems && shieldItems.length > 0 && shieldItems[0].system.isDeflector) {
            shieldItem = shieldItems[0];
        }

        /** Apply bonuses. */
        const addScore = (target, title, value, bLocalize = true) => {
            target.value += value;
            if (bLocalize && game?.i18n) {
                target.tooltip.push(game.i18n.format(title, {value: value}));
            } else {
                target.tooltip.push(`${title}: ${value}`);
            }
        }

        if (pilotingRanks > 0) {
            addScore(data.quadrants.forward.targetLock, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.port.targetLock, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.starboard.targetLock, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.aft.targetLock, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
        }

        if (defensiveCountermeasureItem) {
            const defensiveCountermeasureData = defensiveCountermeasureItem.system;
            addScore(data.quadrants.forward.targetLock, defensiveCountermeasureItem.name, defensiveCountermeasureData.targetLockBonus, false);
            addScore(data.quadrants.port.targetLock, defensiveCountermeasureItem.name, defensiveCountermeasureData.targetLockBonus, false);
            addScore(data.quadrants.starboard.targetLock, defensiveCountermeasureItem.name, defensiveCountermeasureData.targetLockBonus, false);
            addScore(data.quadrants.aft.targetLock, defensiveCountermeasureItem.name, defensiveCountermeasureData.targetLockBonus, false);
        }

        if (sizeMod !== 0) {
            addScore(data.quadrants.forward.targetLock, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.port.targetLock, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.starboard.targetLock, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.aft.targetLock, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
        }

        if (forwardTL?.misc < 0 || forwardTL?.misc > 0) addScore(data.quadrants.forward.targetLock, "SFRPG.StarshipSheet.Modifiers.MiscModifier", forwardTL.misc);
        if (portTL?.misc < 0 || portTL?.misc > 0) addScore(data.quadrants.port.targetLock, "SFRPG.StarshipSheet.Modifiers.MiscModifier", portTL.misc);
        if (starboardTL?.misc < 0 || starboardTL?.misc > 0) addScore(data.quadrants.starboard.targetLock, "SFRPG.StarshipSheet.Modifiers.MiscModifier", starboardTL.misc);
        if (aftTL?.misc < 0 || aftTL?.misc > 0) addScore(data.quadrants.aft.targetLock, "SFRPG.StarshipSheet.Modifiers.MiscModifier", aftTL.misc);

        if (shieldItem) {
            const shieldData = shieldItem.system;
            if (shieldData.isDeflector) {
                if (data.quadrants.forward.shields.value > 0) addScore(data.quadrants.forward.targetLock, shieldItem.name, shieldData.armorBonus, false);
                if (data.quadrants.port.shields.value > 0) addScore(data.quadrants.port.targetLock, shieldItem.name, shieldData.armorBonus, false);
                if (data.quadrants.starboard.shields.value > 0) addScore(data.quadrants.starboard.targetLock, shieldItem.name, shieldData.armorBonus, false);
                if (data.quadrants.aft.shields.value > 0) addScore(data.quadrants.aft.targetLock, shieldItem.name, shieldData.armorBonus, false);
            }
        }

        if (armorItem) {
            const armorItemData = armorItem.system;
            if (armorItemData.targetLockPenalty < 0 || armorItemData.targetLockPenalty > 0) {
                addScore(data.quadrants.forward.targetLock, armorItem.name, armorItemData.targetLockPenalty, false);
                addScore(data.quadrants.port.targetLock, armorItem.name, armorItemData.targetLockPenalty, false);
                addScore(data.quadrants.starboard.targetLock, armorItem.name, armorItemData.targetLockPenalty, false);
                addScore(data.quadrants.aft.targetLock, armorItem.name, armorItemData.targetLockPenalty, false);
            }
        }

        if (ablativeArmorItem) {
            const ablativeArmorData = ablativeArmorItem.system;
            if (ablativeArmorData.targetLockPenalty < 0 || ablativeArmorData.targetLockPenalty > 0) {
                addScore(data.quadrants.forward.targetLock, ablativeArmorItem.name, ablativeArmorData.targetLockPenalty, false);
                addScore(data.quadrants.port.targetLock, ablativeArmorItem.name, ablativeArmorData.targetLockPenalty, false);
                addScore(data.quadrants.starboard.targetLock, ablativeArmorItem.name, ablativeArmorData.targetLockPenalty, false);
                addScore(data.quadrants.aft.targetLock, ablativeArmorItem.name, ablativeArmorData.targetLockPenalty, false);
            }
        }

        return fact;
    });
}