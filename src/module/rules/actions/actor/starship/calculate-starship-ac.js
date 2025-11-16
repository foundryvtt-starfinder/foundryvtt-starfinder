import { SFRPGEffectType } from "../../../../modifiers/types.js";

export default function(engine) {
    const processModifier = (bonus, data) => {
        let computedBonus = 0;
        try {
            const roll = Roll.create(bonus.modifier.toString(), data).evaluateSync({strict: false});
            computedBonus = roll.total;
        } catch (e) {
            console.error(e);
        }
        return computedBonus;
    };

    const applyStackedModifiers = (stackedModifiers, data) => {
        return Object.entries(stackedModifiers).reduce((sum, mod) => {
            for (const bonus of mod[1]) {
                sum += processModifier(bonus, data);
            }
            return sum;
        }, 0);
    };

    const applyQuadrantACModifiers = (fact, context, data, addScore, quadrant, effectType) => {
        const modifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === effectType);

        if (modifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                modifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data);
            if (modifierBonus !== 0) {
                addScore(data.quadrants[quadrant].ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", modifierBonus);
            }
        }
    };

    const applyAllACModifiers = (fact, context, data, addScore) => {
        const allACModifiers = fact.modifiers.filter(mod => mod.enabled && mod.effectType === SFRPGEffectType.STARSHIP_ALL_AC);

        if (allACModifiers.length > 0) {
            const stackedModifiers = context.parameters.stackModifiers.process(
                allACModifiers,
                context,
                {actor: fact.actor}
            );
            const modifierBonus = applyStackedModifiers(stackedModifiers, data);
            if (modifierBonus !== 0) {
                addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", modifierBonus);
                addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", modifierBonus);
                addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", modifierBonus);
                addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", modifierBonus);
            }
        }
    };

    engine.closures.add("calculateStarshipArmorClass", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;

        const pilot = (actor.crew?.pilot?.actors) ? actor.crew?.pilot?.actors[0] : null;
        const sizeMod = CONFIG.SFRPG.starshipSizeMod[data.details.size] || 0;

        let pilotingRanks = pilot?.system?.skills?.pil?.ranks || 0;
        if (data.crew.useNPCCrew) {
            pilotingRanks = data.crew.npcData?.pilot?.skills?.pil?.ranks || 0;
        }

        /** Set up base values. */
        const forwardAC = foundry.utils.deepClone(data.quadrants.forward.ac);
        data.quadrants.forward.ac = {
            value: 10,
            misc: (forwardAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const portAC = foundry.utils.deepClone(data.quadrants.port.ac);
        data.quadrants.port.ac = {
            value: 10,
            misc: (portAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const starboardAC = foundry.utils.deepClone(data.quadrants.starboard.ac);
        data.quadrants.starboard.ac = {
            value: 10,
            misc: (starboardAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        const aftAC = foundry.utils.deepClone(data.quadrants.aft.ac);
        data.quadrants.aft.ac = {
            value: 10,
            misc: (aftAC?.misc || 0),
            tooltip: [game?.i18n ? game.i18n.localize("SFRPG.StarshipSheet.Modifiers.Base") : 'Base: 10']
        };

        /** Get modifying items. */
        const armorItems = fact.items.filter(x => x.type === "starshipArmor");
        let armorItem = null;
        let armorItemData = null;
        if (armorItems && armorItems.length > 0) {
            armorItem = armorItems[0];
            armorItemData = armorItem.system;
        }

        const shieldItems = fact.items.filter(x => x.type === "starshipShield");
        let shieldItem = null;
        let shieldItemData = null;
        if (shieldItems && shieldItems.length > 0 && shieldItems[0].system.isDeflector) {
            shieldItem = shieldItems[0];
            shieldItemData = shieldItem.system;
        }

        /** Apply bonuses. */
        const addScore = (target, title, value, bLocalize = true) => {
            target.value += value;
            if (bLocalize && game?.i18n) {
                target.tooltip.push(game.i18n.format(title, {value: value}));
            } else {
                target.tooltip.push(`${title}: ${value}`);
            }
        };

        if (pilotingRanks > 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.PilotSkillBonus", pilotingRanks);
        }

        if (sizeMod !== 0) {
            addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
            addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.SizeModifier", sizeMod);
        }

        if (armorItem) {
            addScore(data.quadrants.forward.ac, armorItem.name, armorItemData.armorBonus, false);
            addScore(data.quadrants.port.ac, armorItem.name, armorItemData.armorBonus, false);
            addScore(data.quadrants.starboard.ac, armorItem.name, armorItemData.armorBonus, false);
            addScore(data.quadrants.aft.ac, armorItem.name, armorItemData.armorBonus, false);
        }

        if (forwardAC?.misc < 0 || forwardAC?.misc > 0) addScore(data.quadrants.forward.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", forwardAC.misc);
        if (portAC?.misc < 0 || portAC?.misc > 0) addScore(data.quadrants.port.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", portAC.misc);
        if (starboardAC?.misc < 0 || starboardAC?.misc > 0) addScore(data.quadrants.starboard.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", starboardAC.misc);
        if (aftAC?.misc < 0 || aftAC?.misc > 0) addScore(data.quadrants.aft.ac, "SFRPG.StarshipSheet.Modifiers.MiscModifier", aftAC.misc);

        if (shieldItem && shieldItemData.isDeflector) {

            if (data.quadrants.forward.shields.value > 0) addScore(data.quadrants.forward.ac, shieldItem.name, shieldItemData.armorBonus, false);
            if (data.quadrants.port.shields.value > 0) addScore(data.quadrants.port.ac, shieldItem.name, shieldItemData.armorBonus, false);
            if (data.quadrants.starboard.shields.value > 0) addScore(data.quadrants.starboard.ac, shieldItem.name, shieldItemData.armorBonus, false);
            if (data.quadrants.aft.shields.value > 0) addScore(data.quadrants.aft.ac, shieldItem.name, shieldItemData.armorBonus, false);

        }

        // Apply quadrant-specific AC modifiers
        applyQuadrantACModifiers(fact, context, data, addScore, 'forward', SFRPGEffectType.STARSHIP_FORWARD_AC);
        applyQuadrantACModifiers(fact, context, data, addScore, 'port', SFRPGEffectType.STARSHIP_PORT_AC);
        applyQuadrantACModifiers(fact, context, data, addScore, 'starboard', SFRPGEffectType.STARSHIP_STARBOARD_AC);
        applyQuadrantACModifiers(fact, context, data, addScore, 'aft', SFRPGEffectType.STARSHIP_AFT_AC);

        // Apply all AC modifiers (affects all quadrants)
        applyAllACModifiers(fact, context, data, addScore);

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
