export default function(engine) {
    engine.closures.add("calculateStarshipArmorClass", (fact, context) => {
        const data = fact.data;

        const pilot = (data.crew?.pilot?.actors) ? data.crew?.pilot?.actors[0] : null;
        const sizeMod = CONFIG.SFRPG.starshipSizeMod[data.details.size] || 0;

        /** Set up base values. */
        const forwardAC = duplicate(data.quadrants.forward.ac);
        data.quadrants.forward.ac = {
            value: 10,
            misc: (forwardAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const portAC = duplicate(data.quadrants.port.ac);
        data.quadrants.port.ac = {
            value: 10,
            misc: (portAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const starboardAC = duplicate(data.quadrants.starboard.ac);
        data.quadrants.starboard.ac = {
            value: 10,
            misc: (starboardAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const aftAC = duplicate(data.quadrants.aft.ac);
        data.quadrants.aft.ac = {
            value: 10,
            misc: (aftAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        /** Get modifying items. */
        const armorItems = fact.items.filter(x => x.type === "starshipArmor");
        let armorItem = null;
        if (armorItems && armorItems.length > 0) {
            armorItem = armorItems[0];
        }

        const shieldItems = fact.items.filter(x => x.type === "starshipShield");
        let shieldItem = null;
        if (shieldItems && shieldItems.length > 0 && shieldItems[0].data.isDeflector) {
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

        if (data.attributes.pilotingBonus.value > 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.PilotingBonus", data.attributes.pilotingBonus.value);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.PilotingBonus", data.attributes.pilotingBonus.value);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.PilotingBonus", data.attributes.pilotingBonus.value);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.PilotingBonus", data.attributes.pilotingBonus.value);
        }

        if (pilot && pilot?.data?.data?.skills?.pil?.ranks > 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilot.data.data.skills.pil.ranks);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilot.data.data.skills.pil.ranks);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilot.data.data.skills.pil.ranks);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilot.data.data.skills.pil.ranks);
        }

        if (sizeMod !== 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
        }

        if (armorItem) {
            addScore(data.quadrants.forward.ac, armorItem.name, armorItem.data.armorBonus, false);
            addScore(data.quadrants.port.ac, armorItem.name, armorItem.data.armorBonus, false);
            addScore(data.quadrants.starboard.ac, armorItem.name, armorItem.data.armorBonus, false);
            addScore(data.quadrants.aft.ac, armorItem.name, armorItem.data.armorBonus, false);
        }

        if (forwardAC?.misc < 0 || forwardAC?.misc > 0) addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", forwardAC.misc);
        if (portAC?.misc < 0 || portAC?.misc > 0) addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", portAC.misc);
        if (starboardAC?.misc < 0 || starboardAC?.misc > 0) addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", starboardAC.misc);
        if (aftAC?.misc < 0 || aftAC?.misc > 0) addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", aftAC.misc);

        if (shieldItem && shieldItem.data.isDeflector) {

            if (data.quadrants.forward.shields.value > 0) addScore(data.quadrants.forward.ac, shieldItem.name, shieldItem.data.armorBonus, false);
            if (data.quadrants.port.shields.value > 0) addScore(data.quadrants.port.ac, shieldItem.name, shieldItem.data.armorBonus, false);
            if (data.quadrants.starboard.shields.value > 0) addScore(data.quadrants.starboard.ac, shieldItem.name, shieldItem.data.armorBonus, false);
            if (data.quadrants.aft.shields.value > 0) addScore(data.quadrants.aft.ac, shieldItem.name, shieldItem.data.armorBonus, false);
            
        }
        
        return fact;
    });
}