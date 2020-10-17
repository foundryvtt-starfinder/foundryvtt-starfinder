export class CombatSFRPG extends Combat {
    async begin() {
        console.log('beginning combat');
        console.log(this);
    
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

        await this._notifyAfterUpdate(eventData);
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
        this.data.turn = Math.clamped(this.data.turn, 0, turns.length-1);
        return this.turns = turns;
    }

    async previousTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }
        
        console.log('previous turn');
        console.log(this);

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
        
        console.log('next turn');
        console.log(this);

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
        console.log(["_notifyBeforeUpdate", eventData]);
        //console.log([isNewRound, isNewPhase, isNewTurn]);
        //console.log([this.round, this.data.flags.sfrpg.phase, this.turn]);
    }

    async _notifyAfterUpdate(eventData) {
        console.log(["_notifyAfterUpdate", eventData]);
        //console.log([isNewRound, isNewPhase, isNewTurn]);
        //console.log([this.round, this.data.flags.sfrpg.phase, this.turn]);

        if (eventData.isNewRound) {
            console.log(`Starting new round! New phase is ${eventData.newPhase.name}, it is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewRoundChatCard(eventData);
        }
        
        if (eventData.isNewPhase) {
            console.log(`Starting ${eventData.newPhase.name} phase! It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewPhaseChatCard(eventData);
        }
        
        if (eventData.newCombatant) {
            console.log(`[${eventData.newPhase.name}] It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewTurnChatCard(eventData);
        }
    }

    async _printNewRoundChatCard(eventData) {
        // Basic template rendering data
        const speakerName = "The GM";
        const templateData = {
            header: {
                image: "icons/svg/mystery-man.svg",
                name: `Round ${this.round}`
            },
            body: {
                header: `New Round`,
                headerColor: CombatSFRPG.colors.round
            },
            footer: {
                content: `Starship Combat - ${eventData.newPhase.name} phase`
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
        // Basic template rendering data
        const speakerName = "The GM";
        const templateData = {
            header: {
                image: "icons/svg/mystery-man.svg",
                name: `${eventData.newPhase.name} Phase`
            },
            body: {
                header: eventData.newPhase.name,
                headerColor: CombatSFRPG.colors.phase,
                message: {
                    title: "Description",
                    body: eventData.newPhase.description
                }
            },
            footer: {
                content: `Starship Combat - ${eventData.newPhase.name} phase`
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
        // Basic template rendering data
        const speakerName = eventData.newCombatant.name;
        const templateData = {
            header: {
                image: eventData.newCombatant.img,
                name: `${eventData.newCombatant.name}'s Turn`
            },
            body: {
                header: "",
                headerColor: CombatSFRPG.colors.turn,
                message: {
                    title: eventData.newPhase.name,
                    body: eventData.newPhase.description
                }
            },
            footer: {
                content: `Starship Combat - ${eventData.newPhase.name} phase`
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
        if (this.getCombatType() === "starship") {
            let pilotActor = this._getPilotForStarship(combatant.actor);
            rollData = pilotActor ? pilotActor.getRollData() : { skills: { pil: { mod: 0 } } };
        } else {
            rollData = combatant.actor ? combatant.actor.getRollData() : {};
        }
        return Roll.create(formula, rollData).roll();
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
    console.log('config combat');
    console.log(combat);

    const combatType = combat.data.flags?.sfrpg?.combatType || "normal";
    const types = ["normal", "starship", "vehicleChase"];
    const indexOf = types.indexOf(combatType);
    const wrappedIndex = (types.length + indexOf + direction) % types.length;
    
    const update = {
        "flags.sfrpg.combatType": types[wrappedIndex]
    };
    await combat.update(update);
    console.log(`Combat is now of type ${types[wrappedIndex]}`);
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

    const localizedNames = {
        "normal": game.i18n.format(CombatSFRPG.normalCombat.name),
        "starship": game.i18n.format(CombatSFRPG.starshipCombat.name),
        "vehicleChase": game.i18n.format(CombatSFRPG.vehicleChase.name)
    };

    const isRunning = (activeCombat.data.round > 0 || activeCombat.data.turn > 0);
    if (!isRunning) {
        const prevCombatTypeButton = `<a class="combat-type-prev" title="Switch to previous combat type"><i class="fas fa-caret-left"></i></a>`;
        const nextCombatTypeButton = `<a class="combat-type-next" title="Switch to next combat type"><i class="fas fa-caret-right"></i></a>`;
        roundHeader.replaceWith(`<div>${originalHtml}<h4>${prevCombatTypeButton} &nbsp; ${localizedNames[activeCombat.getCombatType()]} &nbsp; ${nextCombatTypeButton}</h4></div>`);
        
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
            roundHeader.replaceWith(`<div>${originalHtml}<h4>${activeCombat.getCurrentPhase().name}</h4></div>`);
        }
    }
});

CombatSFRPG.colors = {
    round: "Salmon",
    phase: "LightGreen",
    turn: null
};

CombatSFRPG.normalCombat = {
    name: "Normal Combat",
    initiativeSorting: "desc",
    phases: [
        {
            name: "Combat",
            iterateTurns: true,
            resetInitiative: false
        }
    ]
};

CombatSFRPG.starshipCombat = {
    name: "Starship Combat",
    initiativeSorting: "asc",
    phases: [
        {
            name: "Changing Roles",
            description: "Anyone who wishes to change starship roles, may do so now.",
            iterateTurns: false,
            resetInitiative: false
        },
        {
            name: "Engineering",
            description: "Captains, Engineers, Magic Officers, Chief Mates and Deck Hands may choose to act during this phase.",
            iterateTurns: false,
            resetInitiative: false
        },
        {
            name: "Helm (Piloting)",
            description: "Pilots may now roll their piloting checks to determine this round's initiative.",
            iterateTurns: false,
            resetInitiative: true
        },
        {
            name: "Helm (Execution)",
            description: "Captains, Pilots, Science Officers, Chief Mates and Deck Hands may choose to act during this phase.",
            iterateTurns: true,
            resetInitiative: false
        },
        {
            name: "Gunnery",
            description: "Captains, and Gunners may choose to act during this phase.",
            iterateTurns: true,
            resetInitiative: false
        },
        {
            name: "Damage",
            description: "Everyone now processes their received damages, critical thresholds, etc.",
            iterateTurns: false,
            resetInitiative: false
        }
    ]
};

CombatSFRPG.vehicleChase = {
    name: "Vehicle Chase",
    initiativeSorting: "desc",
    phases: [
        {
            name: "Pilot Actions",
            description: "Drivers may now decide their maneuvers.",
            iterateTurns: true,
            resetInitiative: false
        },
        {
            name: "Chase progress",
            description: "The GM will now process the chase progress results.",
            iterateTurns: false,
            resetInitiative: false
        },
        {
            name: "Combat",
            description: "Everyone may now act their combat turn.",
            iterateTurns: true,
            resetInitiative: false
        }
    ]
};

CombatSFRPG.errors = {
    historyLimitedResetInitiative: "The current phase has reset initiative, we cannot go back further in history.<br/><br/>Click to dismiss.",
    historyLimitedStartOfEncounter: "You have reached the start of the encounter, we cannot go back further in history.<br/><br/>Click to dismiss.",
    missingInitiative: "The current phase has reset initiative, please re-roll initiative on all combatants before continueing.<br/><br/>Click to dismiss."
};
