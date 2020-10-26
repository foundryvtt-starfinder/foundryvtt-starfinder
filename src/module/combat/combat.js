/*
The following hooks were added:
"onBeginCombat", one argument, type object, contains all event data
"onBeforeUpdateCombat", one argument, type object, contains all event data
"onAfterUpdateCombat", one argument, type object, contains all event data
"onBeforeCombatEnd": one argument, combat object right before it is deleted

Event data is an object with the following data:
eventData: {
  combat: Reference to the combat item,
  isNewRound: Whether a new round is going to start/has started (Depends on the hook if it is about to start, or has already started),
  isNewPhase: Whether a new phase is going to start/has started,
  isNewTurn: Whether a new turn is going to start/has started,
  oldRound: Integer representing the old value for round,
  newRound: Integer representing the current value for round,
  oldPhase: Object representing the old value for phase,
  newPhase: Object representing the new value for phase,
  oldCombatant: Object representing the old value for the active combatant,
  newCombatant: Object representing the new value for the active combatant
}

Phase is an object with the following data:
phase: {
  name: Localization key of the name,
  description: Localization key of the description,
  iterateTurns: Boolean representing if this phase has combatants acting in order,
  resetInitiative: Boolean representing if this phase resets all initiative rolls
}

These are the currently supported combat types:
"normal": For normal combat.
Normal has only one phase, "Combat".

"starship": For starship combat.
Starship has the following 6 phases: "Changing Roles", "Engineering", "Piloting Check", "Helm", "Gunnery", and "Damage"

"vehicleChase": For vehicle chases
Vehicle has the following 3 phases: "Pilot Actions", "Chase Progress", and "Combat"

*/

export class CombatSFRPG extends Combat {
    async begin() {
        const update = {
            "flags.sfrpg.combatType": this.getCombatType(),
            "flags.sfrpg.phase": 0
        };
    
        await this.update(update);

        const currentPhase = this.getCurrentPhase();
        const eventData = {
            combat: this,
            isNewRound: true,
            isNewPhase: true,
            isNewTurn: currentPhase.iterateTurns,
            oldRound: this.round,
            newRound: this.round,
            oldPhase: currentPhase,
            newPhase: currentPhase,
            oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
            newCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
        };

        if (eventData.isNewPhase) {
            if (this.round.resetInitiative) {
                const updates = this.data.combatants.map(c => { return {
                    _id: c._id,
                    initiative: null
                }});
                await this.updateEmbeddedEntity("Combatant", updates);
            }
        }

        Hooks.callAll("onBeginCombat", eventData);
        await this._notifyAfterUpdate(eventData);
    }

    async delete(options={}) {
        Hooks.callAll("onBeforeCombatEnd", this);
        super.delete(options);
    }

    setupTurns() {
        let sortMethod = "desc";
        switch (this.getCombatType()) {
            default:
            case "normal":
                sortMethod = CombatSFRPG.normalCombat.initiativeSorting;
                break;
            case "starship":
                sortMethod = CombatSFRPG.starshipCombat.initiativeSorting;
                break;
            case "vehicleChase":
                sortMethod = CombatSFRPG.vehicleChase.initiativeSorting;
                break;
        }

        const combatants = this.data.combatants;
        const scene = game.scenes.get(this.data.scene);
        const players = game.users.players;
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);
        const turns = combatants.map(c => this._prepareCombatant(c, scene, players, settings)).sort(sortMethod === "asc" ? this._sortCombatantsAsc : this._sortCombatants);
        this.data.turn = Math.clamped(this.data.turn, -1, turns.length-1);
        return this.turns = turns;
    }

    async previousTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }
        
        let nextRound = this.round;
        let nextPhase = this.data.flags.sfrpg.phase;
        let nextTurn = this.turn - 1;

        const currentPhase = this.getCurrentPhase();
        if (currentPhase.resetInitiative) {
            ui.notifications.error(game.i18n.format(CombatSFRPG.errors.historyLimitedResetInitiative), {permanent: false});
            return;
        }

        if (currentPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
                nextTurn = -1;
                for (let [index, combatant] of turnEntries) {
                    if (index >= this.turn) continue;
                    if (!combatant.defeated) {
                        nextTurn = index;
                        break;
                    }
                }
            }
        }
        
        if (nextTurn < 0) {
            nextTurn = 0;
            nextPhase = nextPhase - 1;
            if (nextPhase < 0) {
                nextPhase = this.getPhases().length - 1;
                nextRound -= 1;
                if (nextRound <= 0) {
                    ui.notifications.error(game.i18n.format(CombatSFRPG.errors.historyLimitedStartOfEncounter), {permanent: false});
                    return;
                }
            }
        }

        if (nextPhase !== this.data.flags.sfrpg.phase || nextRound !== this.round) {
            const newPhase = this.getPhases()[nextPhase];
            if (newPhase.iterateTurns) {
                nextTurn = this.getIndexOfLastUndefeatedCombatant();
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);
    }

    async nextTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }
        
        let nextRound = this.round;
        let nextPhase = this.data.flags.sfrpg.phase;
        let nextTurn = this.turn + 1;

        const phases = this.getPhases();
        const currentPhase = phases[this.data.flags.sfrpg.phase];
        if (currentPhase.resetInitiative && this.hasCombatantsWithoutInitiative()) {
            ui.notifications.error(game.i18n.format(CombatSFRPG.errors.missingInitiative), {permanent: false});
            return;
        }

        if (currentPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                for (let [index, combatant] of this.turns.entries()) {
                    if (index < nextTurn) continue;
                    if (!combatant.defeated) {
                        nextTurn = index;
                        break;
                    }
                }
            }
        
            if (nextTurn >= this.turns.length) {
                nextPhase += 1;
                nextTurn = 0;
            }
        } else {
            nextPhase += 1;
            nextTurn = 0;
        }

        if (nextPhase >= phases.length) {
            nextRound += 1;
            nextPhase = 0;
            nextTurn = 0;
        }

        if (nextPhase !== this.data.flags.sfrpg.phase) {
            const newPhase = phases[nextPhase];
            if (newPhase.iterateTurns) {
                nextTurn = this.getIndexOfFirstUndefeatedCombatant();
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);
    }

    async previousRound() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        const indexOfFirstUndefeatedCombatant = this.getIndexOfFirstUndefeatedCombatant();

        let nextRound = this.round;
        let nextPhase = 0;
        let nextTurn = 0;

        if (this.data.flags.sfrpg.phase === 0 && this.turn <= indexOfFirstUndefeatedCombatant) {
            nextRound = Math.max(1, this.round - 1);
        }

        const phases = this.getPhases();
        const newPhase = phases[nextPhase];
        if (newPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                nextTurn = indexOfFirstUndefeatedCombatant;
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);
    }

    async nextRound() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        const indexOfFirstUndefeatedCombatant = this.getIndexOfFirstUndefeatedCombatant();

        let nextRound = this.round + 1;
        let nextPhase = 0;
        let nextTurn = 0;

        const phases = this.getPhases();
        const newPhase = phases[nextPhase];
        if (newPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                nextTurn = indexOfFirstUndefeatedCombatant;
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);
    }

    async _handleUpdate(nextRound, nextPhase, nextTurn) {
        const phases = this.getPhases();
        const currentPhase = phases[this.data.flags.sfrpg.phase];
        const newPhase = phases[nextPhase];

        const eventData = {
            combat: this,
            isNewRound: nextRound != this.round,
            isNewPhase: nextRound != this.round || nextPhase != this.data.flags.sfrpg.phase,
            isNewTurn: (nextRound != this.round && phases[nextPhase].iterateTurns) || nextTurn != this.turn,
            oldRound: this.round,
            newRound: nextRound,
            oldPhase: currentPhase,
            newPhase: newPhase,
            oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
            newCombatant: newPhase.iterateTurns ? this.turns[nextTurn] : null,
        };

        if (!eventData.isNewRound && !eventData.isNewPhase && !eventData.isNewTurn) {
            return;
        }

        await this._notifyBeforeUpdate(eventData);

        if (!newPhase.iterateTurns) {
            nextTurn = -1;
        }

        const updateData = {
            round: nextRound,
            "flags.sfrpg.phase": nextPhase,
            turn: nextTurn
        };

        const advanceTime = CONFIG.time.turnTime;
        await this.update(updateData, {advanceTime});

        if (eventData.isNewPhase) {
            if (newPhase.resetInitiative) {
                const updates = this.data.combatants.map(c => { return {
                    _id: c._id,
                    initiative: null
                }});
                await this.updateEmbeddedEntity("Combatant", updates);
            }
        }

        await this._notifyAfterUpdate(eventData);
    }

    async _notifyBeforeUpdate(eventData) {
        //console.log(["_notifyBeforeUpdate", eventData]);
        //console.log([isNewRound, isNewPhase, isNewTurn]);
        //console.log([this.round, this.data.flags.sfrpg.phase, this.turn]);

        Hooks.callAll("onBeforeUpdateCombat", eventData);
    }

    async _notifyAfterUpdate(eventData) {
        //console.log(["_notifyAfterUpdate", eventData]);
        //console.log([isNewRound, isNewPhase, isNewTurn]);
        //console.log([this.round, this.data.flags.sfrpg.phase, this.turn]);

        const combatType = this.getCombatType();
        const combatChatSetting = game.settings.get('sfrpg', `${combatType}ChatCards`);

        if (eventData.isNewRound && combatChatSetting !== "disabled") {
            //console.log(`Starting new round! New phase is ${eventData.newPhase.name}, it is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewRoundChatCard(eventData);
        }
        
        if (eventData.isNewPhase && (combatChatSetting === "enabled" || combatChatSetting === "roundsPhases")) {
            //console.log(`Starting ${eventData.newPhase.name} phase! It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewPhaseChatCard(eventData);
        }
        
        if (eventData.newCombatant && combatChatSetting === "enabled") {
            //console.log(`[${eventData.newPhase.name}] It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewTurnChatCard(eventData);
        }

        Hooks.callAll("onAfterUpdateCombat", eventData);
    }

    async _printNewRoundChatCard(eventData) {
        const localizedCombatName = this.getCombatName();
        const localizedPhaseName = game.i18n.format(eventData.newPhase.name);

        // Basic template rendering data
        const speakerName = game.i18n.format(CombatSFRPG.chatCardsText.speaker.GM);
        const templateData = {
            header: {
                image: "icons/svg/mystery-man.svg",
                name: game.i18n.format(CombatSFRPG.chatCardsText.round.headerName, {round: this.round})
            },
            body: {
                header: game.i18n.format(CombatSFRPG.chatCardsText.round.bodyHeader),
                headerColor: CombatSFRPG.colors.round
            },
            footer: {
                content: game.i18n.format(CombatSFRPG.chatCardsText.footer, {combatType: localizedCombatName, combatPhase: localizedPhaseName})
            }
        };

        // Render the chat card template
        const template = `systems/sfrpg/templates/chat/combat-card.html`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: { actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName },
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }

    async _printNewPhaseChatCard(eventData) {
        const localizedCombatName = this.getCombatName();
        const localizedPhaseName = game.i18n.format(eventData.newPhase.name);

        // Basic template rendering data
        const speakerName = game.i18n.format(CombatSFRPG.chatCardsText.speaker.GM);
        const templateData = {
            header: {
                image: "icons/svg/mystery-man.svg",
                name: game.i18n.format(CombatSFRPG.chatCardsText.phase.headerName, {phase: localizedPhaseName})
            },
            body: {
                header: localizedPhaseName,
                headerColor: CombatSFRPG.colors.phase,
                message: {
                    title: game.i18n.format(CombatSFRPG.chatCardsText.phase.messageTitle),
                    body: game.i18n.format(eventData.newPhase.description || "")
                }
            },
            footer: {
                content: game.i18n.format(CombatSFRPG.chatCardsText.footer, {combatType: localizedCombatName, combatPhase: localizedPhaseName})
            }
        };

        // Render the chat card template
        const template = `systems/sfrpg/templates/chat/combat-card.html`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: { actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName },
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }

    async _printNewTurnChatCard(eventData) {
        const localizedCombatName = this.getCombatName();
        const localizedPhaseName = game.i18n.format(eventData.newPhase.name);

        // Basic template rendering data
        const speakerName = eventData.newCombatant.name;
        const templateData = {
            header: {
                image: eventData.newCombatant.img,
                name: game.i18n.format(CombatSFRPG.chatCardsText.turn.headerName, {combatant: eventData.newCombatant.name})
            },
            body: {
                header: "",
                headerColor: CombatSFRPG.colors.turn,
                message: {
                    title: localizedPhaseName,
                    body: game.i18n.format(eventData.newPhase.description || "")
                }
            },
            footer: {
                content: game.i18n.format(CombatSFRPG.chatCardsText.footer, {combatType: localizedCombatName, combatPhase: localizedPhaseName})
            }
        };

        // Render the chat card template
        const template = `systems/sfrpg/templates/chat/combat-card.html`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: { actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName },
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }

    getCombatType() {
        return this.data.flags?.sfrpg?.combatType || "normal";
    }

    getCombatName() {
        switch (this.getCombatType()) {
            default:
            case "normal":
                return game.i18n.format(CombatSFRPG.normalCombat.name);
            case "starship":
                return game.i18n.format(CombatSFRPG.starshipCombat.name);
            case "vehicleChase":
                return game.i18n.format(CombatSFRPG.vehicleChase.name);
        }
    }

    getPhases() {
        switch (this.getCombatType()) {
            default:
            case "normal":
                return CombatSFRPG.normalCombat.phases;
            case "starship":
                return CombatSFRPG.starshipCombat.phases;
            case "vehicleChase":
                return CombatSFRPG.vehicleChase.phases;
        }
    }

    getCurrentPhase() {
        return this.getPhases()[this.data.flags?.sfrpg?.phase || 0];
    }

    hasCombatantsWithoutInitiative() {
        for (let [index, combatant] of this.turns.entries()) {
            if ((!this.settings.skipDefeated || !combatant.defeated) && !combatant.initiative) {
                return true;
            }
        }
        return false;
    }

    getIndexOfFirstUndefeatedCombatant() {
        for (let [index, combatant] of this.turns.entries()) {
            if (!combatant.defeated) {
                return index;
            }
        }
        return null;
    }

    getIndexOfLastUndefeatedCombatant() {
        const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
        for (let [index, combatant] of turnEntries) {
            if (!combatant.defeated) {
                return index;
            }
        }
        return null;
    }

    isEveryCombatantDefeated() {
        return this.getIndexOfFirstUndefeatedCombatant() === null;
    }

    _getInitiativeFormula(combatant) {
        if (this.getCombatType() === "starship") {
            return "1d20 + @skills.pil.mod"
        }
        else {
            return "1d20 + @attributes.init.total";
        }
    }

    _getInitiativeRoll(combatant, formula) {
        let rollData = {};
        let additionalParts = [];
        if (this.getCombatType() === "starship") {
            let pilotActor = this._getPilotForStarship(combatant.actor);
            rollData = pilotActor ? pilotActor.getRollData() : { skills: { pil: { mod: 0 } } };
            if (pilotActor?.data?.data?.skills?.pil?.rolledMods) {
                //additionalParts = pilotActor.data.data.skills.pil.rolledMods.map(x => `${x.mod}[${x.bonus.name}]`);
                additionalParts = pilotActor.data.data.skills.pil.rolledMods.map(x => x.mod);
            }
        } else {
            rollData = combatant.actor ? combatant.actor.getRollData() : {};
            if (combatant?.actor?.data?.data?.attributes?.init?.rolledMods) {
                //additionalParts = combatant.actor.data.data.attributes.init.rolledMods.map(x => `${x.mod}[${x.bonus.name}]`);
                additionalParts = combatant.actor.data.data.attributes.init.rolledMods.map(x => x.mod);
            }
        }

        if (additionalParts.length > 0) {
            formula += " + " + additionalParts.join(" + ");
        }
        
        return Roll.create(formula, rollData).roll();
    }

    async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
  
      // Structure input data
      ids = typeof ids === "string" ? [ids] : ids;
      const currentId = this.combatant?._id;
  
      // Iterate over Combatants, performing an initiative roll for each
      const [updates, messages] = ids.reduce((results, id, i) => {
        let [updates, messages] = results;
  
        // Get Combatant data
        const c = this.getCombatant(id);
        if ( !c || !c.owner ) return results;
  
        // Roll initiative
        const cf = formula || this._getInitiativeFormula(c);
        const roll = this._getInitiativeRoll(c, cf);
        updates.push({_id: id, initiative: roll.total});
  
        // Determine the roll mode
        let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");
        if (( c.token.hidden || c.hidden ) && (rollMode === "roll") ) rollMode = "gmroll";
  
        // Construct chat message data
        let messageData = mergeObject({
          speaker: {
            scene: canvas.scene._id,
            actor: c.actor ? c.actor._id : null,
            token: c.token._id,
            alias: c.token.name
          },
          flavor: `${c.token.name} rolls for Initiative!`,
          flags: {"core.initiativeRoll": true}
        }, messageOptions);
        const chatData = roll.toMessage(messageData, {rollMode, create:false});
        if ( i > 0 ) chatData.sound = null;   // Only play 1 sound for the whole set
        messages.push(chatData);
  
        // Return the Roll and the chat data
        return results;
      }, [[], []]);
      if ( !updates.length ) return this;
  
      // Update multiple combatants
      await this.updateEmbeddedEntity("Combatant", updates);
  
      // Ensure the turn order remains with the same combatant
      if ( updateTurn && currentId ) {
        await this.update({turn: this.turns.findIndex(t => t._id === currentId)});
      }
  
      // Create multiple chat messages
      await CONFIG.ChatMessage.entityClass.create(messages);
  
      // Return the updated Combat
      return this;
    }

    _getPilotForStarship(starshipActor) {
        if (!starshipActor?.data?.flags?.sfrpg?.shipsCrew?.members) {
            return null;
        }

        for (let crewId of starshipActor.data.flags.sfrpg.shipsCrew.members) {
            let crewActor = game.actors.entries.find((x) => x._id === crewId);
            if (crewActor) {
                if (crewActor.data.flags.sfrpg.crewMember.role === "pilot") {
                    return crewActor;
                }
            }
        }
        return null;
    }

    _sortCombatantsAsc(a, b) {
        const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
        const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
        let ci = ia - ib;
        if ( ci !== 0 ) return ci;
        let [an, bn] = [a.token?.name || "", b.token?.name || ""];
        let cn = an.localeCompare(bn);
        if ( cn !== 0 ) return cn;
        return a.tokenId - b.tokenId;
    }
}

async function onConfigClicked(combat, direction) {
    const combatType = combat.data.flags?.sfrpg?.combatType || "normal";
    const types = ["normal", "starship", "vehicleChase"];
    const indexOf = types.indexOf(combatType);
    const wrappedIndex = (types.length + indexOf + direction) % types.length;
    
    const update = {
        "flags.sfrpg.combatType": types[wrappedIndex]
    };
    await combat.update(update);
}

Hooks.on('renderCombatTracker', (app, html, data) => {
    const activeCombat = data.combat;
    if (!activeCombat) {
        return;
    }

    const header = html.find('#combat-round');
    const footer = html.find('.directory-footer');

    const roundHeader = header.find('h3');
    const originalHtml = roundHeader.html();

    const isRunning = (activeCombat.data.round > 0 || activeCombat.data.turn > 0);
    if (!isRunning) {
        const prevCombatTypeButton = `<a class="combat-type-prev" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectPrevType")}"><i class="fas fa-caret-left"></i></a>`;
        const nextCombatTypeButton = `<a class="combat-type-next" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectNextType")}"><i class="fas fa-caret-right"></i></a>`;
        roundHeader.replaceWith(`<div>${originalHtml}<h4>${prevCombatTypeButton} &nbsp; ${activeCombat.getCombatName()} &nbsp; ${nextCombatTypeButton}</h4></div>`);
        
        // Handle button clicks
        const configureButtonPrev = header.find('.combat-type-prev');
        configureButtonPrev.click(ev => {
            ev.preventDefault();
            onConfigClicked(activeCombat, -1);
        });

        const configureButtonNext = header.find('.combat-type-next');
        configureButtonNext.click(ev => {
            ev.preventDefault();
            onConfigClicked(activeCombat, 1);
        });

        const beginButton = footer.find('.combat-control[data-control=startCombat]');
        beginButton.click(ev => {
            ev.preventDefault();
            activeCombat.begin();
        });
    } else {
        const phases = activeCombat.getPhases();
        if (phases.length > 1) {
            roundHeader.replaceWith(`<div>${originalHtml}<h4>${game.i18n.format(activeCombat.getCurrentPhase().name)}</h4></div>`);
        }
    }
});

CombatSFRPG.colors = {
    round: "Salmon",
    phase: "LightGreen",
    turn: null
};

CombatSFRPG.normalCombat = {
    name: "SFRPG.Combat.Normal.Name",
    initiativeSorting: "desc",
    phases: [
        {
            name: "SFRPG.Combat.Normal.Phases.1.Name",
            iterateTurns: true,
            resetInitiative: false
        }
    ]
};

CombatSFRPG.starshipCombat = {
    name: "SFRPG.Combat.Starship.Name",
    initiativeSorting: "asc",
    phases: [
        {
            name: "SFRPG.Combat.Starship.Phases.1.Name",
            description: "SFRPG.Combat.Starship.Phases.1.Description",
            iterateTurns: false,
            resetInitiative: false
        },
        {
            name: "SFRPG.Combat.Starship.Phases.2.Name",
            description: "SFRPG.Combat.Starship.Phases.2.Description",
            iterateTurns: false,
            resetInitiative: false
        },
        {
            name: "SFRPG.Combat.Starship.Phases.3.Name",
            description: "SFRPG.Combat.Starship.Phases.3.Description",
            iterateTurns: false,
            resetInitiative: true
        },
        {
            name: "SFRPG.Combat.Starship.Phases.4.Name",
            description: "SFRPG.Combat.Starship.Phases.4.Description",
            iterateTurns: true,
            resetInitiative: false
        },
        {
            name: "SFRPG.Combat.Starship.Phases.5.Name",
            description: "SFRPG.Combat.Starship.Phases.5.Description",
            iterateTurns: true,
            resetInitiative: false
        },
        {
            name: "SFRPG.Combat.Starship.Phases.6.Name",
            description: "SFRPG.Combat.Starship.Phases.6.Description",
            iterateTurns: false,
            resetInitiative: false
        }
    ]
};

CombatSFRPG.vehicleChase = {
    name: "SFRPG.Combat.VehicleChase.Name",
    initiativeSorting: "desc",
    phases: [
        {
            name: "SFRPG.Combat.VehicleChase.Phases.1.Name",
            description: "SFRPG.Combat.VehicleChase.Phases.1.Description",
            iterateTurns: true,
            resetInitiative: false
        },
        {
            name: "SFRPG.Combat.VehicleChase.Phases.2.Name",
            description: "SFRPG.Combat.VehicleChase.Phases.2.Description",
            iterateTurns: false,
            resetInitiative: false
        },
        {
            name: "SFRPG.Combat.VehicleChase.Phases.3.Name",
            description: "SFRPG.Combat.VehicleChase.Phases.3.Description",
            iterateTurns: true,
            resetInitiative: false
        }
    ]
};

CombatSFRPG.errors = {
    historyLimitedResetInitiative: "SFRPG.Combat.Errors.HistoryLimitedResetInitiative",
    historyLimitedStartOfEncounter: "SFRPG.Combat.Errors.HistoryLimitedStartOfEncounter",
    missingInitiative: "SFRPG.Combat.Errors.MissingInitiative"
};

CombatSFRPG.chatCardsText = {
    round: {
        headerName: `SFRPG.Combat.ChatCards.Round.Header`,
        bodyHeader: `SFRPG.Combat.ChatCards.Round.BodyHeader`,
    },
    phase: {
        headerName: `SFRPG.Combat.ChatCards.Phase.Header`,
        messageTitle: `SFRPG.Combat.ChatCards.Phase.MessageTitle`
    },
    turn: {
        headerName: `SFRPG.Combat.ChatCards.Turn.Header`
    },
    footer: `SFRPG.Combat.ChatCards.Footer`,
    speaker: {
        GM: `SFRPG.Combat.ChatCards.Speaker.GM`
    }
};
