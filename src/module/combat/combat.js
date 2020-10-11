export class CombatSFRPG extends Combat {
    normalCombatPhases = [
        {
            name: "Combat",
            iterateTurns: true,
            resetInitiative: false,
            sortInitiative: "desc",
        }
    ];

    starshipPhases = [
        {
            name: "Changing Roles",
            description: "Anyone who wishes to change starship roles, may do so now.",
            iterateTurns: false,
            resetInitiative: false,
            sortInitiative: null,
        },
        {
            name: "Engineering",
            description: "Captains, Engineers, Magic Officers, Chief Mates and Deck Hands may choose to act during this phase.",
            iterateTurns: false,
            resetInitiative: false,
            sortInitiative: null,
        },
        {
            name: "Helm (Piloting)",
            description: "Pilots may now roll their piloting checks to determine this round's initiative.",
            iterateTurns: false,
            resetInitiative: true,
            sortInitiative: null,
        },
        {
            name: "Helm (Execution)",
            description: "Captains, Pilots, Science Officers, Chief Mates and Deck Hands may choose to act during this phase.",
            iterateTurns: true,
            resetInitiative: false,
            sortInitiative: "asc",
        },
        {
            name: "Gunnery",
            description: "Captains, and Gunners may choose to act during this phase.",
            iterateTurns: true,
            resetInitiative: false,
            sortInitiative: null,
        },
        {
            name: "Damage",
            description: "Everyone now processes their received damages, critical thresholds, etc.",
            iterateTurns: false,
            resetInitiative: false,
            sortInitiative: null,
        }
    ];

    vehicleChasePhases = [
        {
            name: "Piloting",
            description: "Drivers may now decide their maneuvers.",
            iterateTurns: true,
            resetInitiative: false,
            sortInitiative: "desc",
        },
        {
            name: "Chase progress",
            description: "The GM will now process the chase progress results.",
            iterateTurns: false,
            resetInitiative: false,
            sortInitiative: null,
        },
        {
            name: "Combat",
            description: "Everyone may now act their combat turn.",
            iterateTurns: true,
            resetInitiative: false,
            sortInitiative: null,
        }
    ];

    async begin() {
        console.log('beginning combat');
        console.log(this);
    
        let phases = this.normalCombatPhases;
        const combatType = this.data.flags?.sfrpg?.combatType || "normal";
        if (combatType === "starship") {
            phases = this.starshipPhases;
        } else if (combatType === "vehicleChase") {
            phases = this.vehicleChasePhases;
        }
    
        const update = {
            "flags.sfrpg.combatType": combatType,
            "flags.sfrpg.phase": 0,
            "flags.sfrpg.phases": phases
        };
    
        await this.update(update);
    }

    async previousTurn() {
        console.log('previous turn');
        console.log(this);
    
        await super.previousTurn();
    }

    async nextTurn() {
        console.log('next turn');
        console.log(this);

        let nextRound = this.round;
        let nextPhase = this.data.flags.sfrpg.phase;
        let nextTurn = this.turn + 1;

        const currentPhase = this.getCurrentPhase();
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

        if (nextPhase >= this.data.flags.sfrpg.phases.length) {
            nextRound += 1;
            nextPhase = 0;
            nextTurn = 0;
        }

        const newPhase = this.data.flags.sfrpg.phases[nextPhase];

        const eventData = {
            combat: this,
            isNewRound: nextRound != this.round,
            isNewPhase: nextPhase != this.data.flags.sfrpg.phase,
            isNewTurn: nextTurn != this.turn,
            oldRound: this.round,
            newRound: nextRound,
            oldPhase: currentPhase,
            newPhase: newPhase,
            oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
            newCombatant: newPhase.iterateTurns ? this.turns[nextTurn] : null,
        };

        await this._notifyBeforeUpdate(eventData);

        const updateData = {
            round: nextRound,
            "flags.sfrpg.phase": nextPhase,
            turn: nextTurn
        };

        const advanceTime = CONFIG.time.turnTime;
        await this.update(updateData, {advanceTime});

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
                headerColor: 'Salmon'
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
                headerColor: 'LightGreen',
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

    async previousRound() {
        console.log('previous round');
        console.log(this);
    
        const oldRound = this.data.round;
        const oldPhase = this.data.flags.sfrpg.phase;
        const oldTurn = this.data.turn;
    
        const newRound = Math.max(1, oldRound - 1);
        const newPhase = 0;
        const newTurn = 0; // TODO: Skip defeated, if phases[newPhase].iterateTurns
    
        const update = {
            round: newRound,
            "flags.sfrpg.phase": newPhase,
            turn: newTurn
        };
    
        await this.update(update);
    
        await this._handlePhaseStart();
    }

    async nextRound() {
        console.log('next round');
        console.log(this);
    
        const oldRound = this.data.round;
        const oldPhase = this.data.flags.sfrpg.phase;
        const oldTurn = this.data.turn;
    
        const newRound = Math.max(1, oldRound + 1);
        const newPhase = 0;
        const newTurn = 0; // TODO: Skip defeated, if phases[newPhase].iterateTurns
    
        const update = {
            round: newRound,
            "flags.sfrpg.phase": newPhase,
            turn: newTurn
        };
    
        await this.update(update);
    
        await this._handlePhaseStart();
    }

    getCurrentPhase() {
        return this.data.flags.sfrpg.phases[this.data.flags.sfrpg.phase];
    }

    async _handlePhaseStart() {
        const currentPhaseIndex = this.data.flags.sfrpg.phase;
        const currentPhase = this.data.flags.sfrpg.phases[currentPhaseIndex];
    
        console.log(`> Starting phase: ${currentPhase.name}`);
    
        if (currentPhase.resetInitiative) {
            for (let combatant of this.combatants) {
                await this.setInitative(combatant._id, null);
            }
        }
        
        if (currentPhase.sortInitiative) {
            let turns = duplicate(this.turns);
            switch (currentPhase.sortInitiative) {
                case "asc":
                    turns = turns.sort((a, b) => {
                        const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
                        const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
                        let ci = ia - ib;
                        if ( ci !== 0 ) return ci;
                        let [an, bn] = [a.token.name || "", b.token.name || ""];
                        let cn = an.localeCompare(bn);
                        if ( cn !== 0 ) return cn;
                        return a.tokenId - b.tokenId;
                    });
                    break;
                case "desc":
                    turns = turns.sort((a, b) => {
                        const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
                        const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
                        let ci = ib - ia;
                        if ( ci !== 0 ) return ci;
                        let [an, bn] = [a.token.name || "", b.token.name || ""];
                        let cn = an.localeCompare(bn);
                        if ( cn !== 0 ) return cn;
                        return a.tokenId - b.tokenId;
                    });
                    break;
            }
            await this.update({turns: turns});
        }
    }
}

async function onConfigClicked(combat) {
    console.log('config combat');
    console.log(combat);

    const combatType = combat.data.flags?.sfrpg?.combatType || "normal";
    const types = ["normal", "starship", "vehicleChase"];
    const indexOf = types.indexOf(combatType);
    const wrappedIndex = (indexOf + 1) % types.length;
    
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

    const footer = html.find('.directory-footer');
    const isRunning = (activeCombat.data.round > 0 || activeCombat.data.turn > 0);
    if (!isRunning) {
        const configureButtonHtml = (`<button class="combatConfigButton"><i class="fas fa-cog"></i>Config</button>`);

        const footerNode = footer[0];
        footerNode.classList.remove('directory-footer');
        footerNode.classList.add('combat-config-directory-footer');
        footerNode.classList.remove('flexrow');
        footerNode.insertAdjacentHTML("beforeend", configureButtonHtml);
        
        // Handle button clicks
        const configureButton = footer.find('.combatConfigButton');
        configureButton.click(ev => {
            ev.preventDefault();
            onConfigClicked(activeCombat);
        });

        const beginButton = footer.find('.combat-control[data-control=startCombat]');
        beginButton.click(ev => {
            ev.preventDefault();
            activeCombat.begin();
        });
    }
});