import { CombatDifficulty } from "../apps/combat-difficulty.js";
import { DiceSFRPG } from "../dice.js";
import RollContext from "../rolls/rollcontext.js";

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
    static HiddenTurn = 0;

    _preCreate(data, options, user) {
        const update = {
            "flags.sfrpg.combatType": this.getCombatType(),
            "flags.sfrpg.phase": 0
        };

        this.updateSource(update);
    }

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
            newCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null
        };

        if (eventData.isNewPhase) {
            if (this.round.resetInitiative) {
                const updates = this.combatants.map(c => {
                    return {
                        _id: c.id,
                        initiative: null
                    };
                });
                await this.updateEmbeddedDocuments("Combatant", updates);
            }
        }

        Hooks.callAll("onBeginCombat", eventData);
        await this._notifyAfterUpdate(eventData);
    }

    async delete(options = {}) {
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

        const combatants = this.combatants;
        const scene = game.scenes.get(this.scene);
        const players = game.users.players;
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);
        const turns = this.combatants.contents.sort(sortMethod === "asc" ? this._sortCombatantsAsc : this._sortCombatants);
        this.turn = Math.clamped(this.turn, CombatSFRPG.HiddenTurn, turns.length - 1);

        return this.turns = turns;
    }

    async previousTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        let nextRound = this.round;
        let nextPhase = this.flags.sfrpg.phase;
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
            if (this.settings.skipDefeated) {
                nextTurn = this.getIndexOfFirstUndefeatedCombatant();
            } else {
                nextTurn = 0;
            }
            nextPhase -= 1;
            if (nextPhase < 0) {
                nextPhase = this.getPhases().length - 1;
                nextRound -= 1;
                if (nextRound <= 0) {
                    ui.notifications.error(game.i18n.format(CombatSFRPG.errors.historyLimitedStartOfEncounter), {permanent: false});
                    return;
                }
            }
        }

        if (nextPhase !== this.flags.sfrpg.phase || nextRound !== this.round) {
            const newPhase = this.getPhases()[nextPhase];
            if (newPhase.iterateTurns) {
                if (this.settings.skipDefeated) {
                    nextTurn = this.getIndexOfLastUndefeatedCombatant();
                } else {
                    nextTurn = this.turns.length - 1;
                }
            }
        }

        await this._handleUpdate(nextRound, nextPhase, nextTurn);
    }

    async nextTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        let nextRound = this.round;
        let nextPhase = this.flags.sfrpg.phase;
        let nextTurn = this.turn + 1;

        const phases = this.getPhases();
        const currentPhase = phases[this.flags.sfrpg.phase];
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

                // Skip the next actors if they are dead.
                const lastUndefeatedIndex = this.getIndexOfLastUndefeatedCombatant();
                if (nextTurn > lastUndefeatedIndex) {
                    nextTurn = this.turns.length + 1;
                }
            }

            if (nextTurn >= this.turns.length) {
                nextPhase += 1;
                if (this.settings.skipDefeated) {
                    nextTurn = this.getIndexOfFirstUndefeatedCombatant();
                } else {
                    nextTurn = 0;
                }
            }
        } else {
            nextPhase += 1;
            if (this.settings.skipDefeated) {
                nextTurn = this.getIndexOfFirstUndefeatedCombatant();
            } else {
                nextTurn = 0;
            }
        }

        if (nextPhase >= phases.length) {
            nextRound += 1;
            nextPhase = 0;
            if (this.settings.skipDefeated) {
                nextTurn = this.getIndexOfFirstUndefeatedCombatant();
            } else {
                nextTurn = 0;
            }
        }

        if (nextPhase !== this.flags.sfrpg.phase) {
            const newPhase = phases[nextPhase];
            if (newPhase.iterateTurns) {
                if (this.settings.skipDefeated) {
                    nextTurn = this.getIndexOfFirstUndefeatedCombatant();
                } else {
                    nextTurn = 0;
                }
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

        if (this.flags.sfrpg.phase === 0 && this.turn <= indexOfFirstUndefeatedCombatant) {
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
        const currentPhase = phases[this.flags.sfrpg.phase];
        const newPhase = phases[nextPhase];

        const eventData = {
            combat: this,
            isNewRound: nextRound != this.round,
            isNewPhase: nextRound != this.round || nextPhase != this.flags.sfrpg.phase,
            isNewTurn: (nextRound != this.round && phases[nextPhase].iterateTurns) || nextTurn != this.turn,
            oldRound: this.round,
            newRound: nextRound,
            oldPhase: currentPhase,
            newPhase: newPhase,
            oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
            newCombatant: newPhase.iterateTurns ? this.turns[nextTurn] : null
        };

        if (!eventData.isNewRound && !eventData.isNewPhase && !eventData.isNewTurn) {
            return;
        }

        await this._notifyBeforeUpdate(eventData);

        if (!newPhase.iterateTurns) {
            nextTurn = CombatSFRPG.HiddenTurn;
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
                const updates = this.combatants.map(c => {
                    return {
                        _id: c.id,
                        initiative: null
                    };
                });
                await this.updateEmbeddedDocuments("Combatant", updates);
            }
        }

        await this._notifyAfterUpdate(eventData);
    }

    async _notifyBeforeUpdate(eventData) {
        // console.log(["_notifyBeforeUpdate", eventData]);
        // console.log([isNewRound, isNewPhase, isNewTurn]);
        // console.log([this.round, this.flags.sfrpg.phase, this.turn]);

        Hooks.callAll("onBeforeUpdateCombat", eventData);
    }

    async _notifyAfterUpdate(eventData) {
        // console.log(["_notifyAfterUpdate", eventData]);
        // console.log([isNewRound, isNewPhase, isNewTurn]);
        // console.log([this.round, this.flags.sfrpg.phase, this.turn]);

        const combatType = this.getCombatType();
        const combatChatSetting = game.settings.get('sfrpg', `${combatType}ChatCards`);

        if (eventData.isNewRound && (combatChatSetting !== "disabled" || combatChatSetting === "roundsTurns")) {
            // console.log(`Starting new round! New phase is ${eventData.newPhase.name}, it is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewRoundChatCard(eventData);
        }

        if (eventData.isNewPhase && (combatChatSetting === "enabled" || combatChatSetting === "roundsPhases")) {
            // console.log(`Starting ${eventData.newPhase.name} phase! It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
            await this._printNewPhaseChatCard(eventData);
        }

        if (eventData.newCombatant && (combatChatSetting === "enabled" || combatChatSetting === "roundsTurns")) {
            // console.log(`[${eventData.newPhase.name}] It is now the turn of: ${eventData.newCombatant?.name || "the GM"}!`);
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
        const template = `systems/sfrpg/templates/chat/combat-card.hbs`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
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
        const template = `systems/sfrpg/templates/chat/combat-card.hbs`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
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
        const template = `systems/sfrpg/templates/chat/combat-card.hbs`;
        const html = await renderTemplate(template, templateData);

        // Create the chat message
        const chatData = {
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
            whisper: eventData.newCombatant.hidden ? ChatMessage.getWhisperRecipients("GM") : [],
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }

    getCombatType() {
        return this.flags?.sfrpg?.combatType || "normal";
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
        return this.getPhases()[this.flags?.sfrpg?.phase || 0];
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

    renderCombatPhase(html) {
        let phaseDisplay = document.createElement("h4");
        phaseDisplay.classList.add("combat-type");
        phaseDisplay.innerHTML = game.i18n.format(this.getCurrentPhase().name);
        html.getElementsByClassName('combat-tracker-header')[0].appendChild(phaseDisplay);
    }

    renderCombatTypeControls(html) {
        const prevCombatTypeButton = `<a class="combat-type-prev" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectPrevType")}"><i class="fas fa-caret-left"></i></a>`;
        const nextCombatTypeButton = `<a class="combat-type-next" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectNextType")}"><i class="fas fa-caret-right"></i></a>`;

        let combatTypeControls = document.createElement("div");
        combatTypeControls.classList.add("combat-type");
        combatTypeControls.innerHTML = `${prevCombatTypeButton} &nbsp; ${this.getCombatName()} &nbsp; ${nextCombatTypeButton}`;
        html.getElementsByClassName('combat-tracker-header')[0].appendChild(combatTypeControls);
    }

    renderDifficulty(diffObject, html) {
        const difficulty = diffObject.difficultyData.difficulty;
        const combatType = this.getCombatType();

        let difficultyContainer = document.createElement("div");
        difficultyContainer.classList.add("combat-difficulty-container");

        let difficultyHTML = document.createElement("a");
        difficultyHTML.classList.add("combat-difficulty", difficulty);
        if (combatType === 'normal') {
            difficultyHTML.title = `${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.PCs")}: ${diffObject.difficultyData.PCs.length} [${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.APL")} ${diffObject.difficultyData.APL}]\n${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.HostileNPCs")}: ${diffObject.difficultyData.enemies.length} [${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.CR")} ${diffObject.difficultyData.CR}]`;
        } else if (combatType === 'starship') {
            difficultyHTML.title = game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.ClickForDetails");
        }
        difficultyHTML.innerHTML = `Difficulty: ${CONFIG.SFRPG.difficultyLevels[difficulty]}`;

        difficultyContainer.appendChild(difficultyHTML);
        html.getElementsByClassName('combat-tracker-header')[0].appendChild(difficultyContainer);
    }

    _getInitiativeFormula(combatant) {
        if (this.getCombatType() === "starship") {
            return "1d20 + @pilot.skills.pil.mod";
        } else {
            return "1d20 + @combatant.attributes.init.total";
        }
    }

    async _getInitiativeRoll(combatant, formula) {
        const rollContext = RollContext.createActorRollContext(combatant.actor, {actorKey: "combatant"});

        const parts = [];

        if (this.getCombatType() === "starship") {
            parts.push("@pilot.skills.pil.mod");
            rollContext.setMainContext("pilot");
        } else {
            parts.push("@combatant.attributes.init.total");
            if (game.settings.get("sfrpg", "useInitiativeTiebreaker")) {
                parts.push(combatant.actor.system.attributes.init.total / 100);
            }
        }

        const rollResult = await DiceSFRPG.createRoll({
            rollContext: rollContext,
            parts: parts,
            title: game.i18n.format("SFRPG.Rolls.InitiativeRollFull", {name: combatant.actor.name})
        });

        rollResult.roll.flags = { sfrpg: { finalFormula: rollResult.formula } };
        return rollResult.roll;
    }

    async rollInitiative(ids, {formula = null, updateTurn = true, messageOptions = {}} = {}) {

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        let isFirst = true;
        for (const id of ids) {
            // Get Combatant data
            const combatant = this.combatants.get(id);
            if ( !combatant?.isOwner ) return results;

            // Roll initiative
            const roll = await this._getInitiativeRoll(combatant, "");
            if (!roll) {
                continue;
            }
            updates.push({_id: id, initiative: roll.total});

            // Construct chat message data
            let messageData = mergeObject({
                speaker: {
                    scene: game.scenes.current?.id,
                    actor: combatant.actor ? combatant.actor.id : null,
                    token: combatant.token.id,
                    alias: combatant.token.name
                },
                flavor: `${combatant.token.name} rolls for Initiative!`,
                flags: {"core.initiativeRoll": true}
            }, messageOptions);

            const preparedRollExplanation = DiceSFRPG.formatFormula(roll.flags.sfrpg.finalFormula.formula);
            const rollContent = await roll.render();
            const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
            const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);

            rollMode = roll.options?.rollMode ?? rollMode;

            const chatData = {
                flavor: messageData.flavor,
                speaker: messageData.speaker,
                flags: messageData.flags,
                content: explainedRollContent,
                rollMode: combatant.hidden && (rollMode === "roll") ? "gmroll" : rollMode,
                roll: roll,
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                sound: CONFIG.sounds.dice
            };

            if ( !isFirst ) {
                chatData.sound = null;   // Only play 1 sound for the whole set
            }
            isFirst = false;
            messages.push(chatData);
        }

        if ( !updates.length ) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Ensure the turn order remains with the same combatant
        if ( updateTurn && currentId ) {
            await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
        }

        // Create multiple chat messages
        await CONFIG.ChatMessage.documentClass.create(messages);

        // Return the updated Combat
        return this;
    }

    _getPilotForStarship(starshipActor) {
        const pilotIds = starshipActor.getActorIdsForCrewRole("pilot");
        if (!pilotIds || pilotIds.length === 0) {
            return null;
        }

        return game.actors.entries.find(x => x.id === pilotIds[0]);
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
    const combatType = combat.flags?.sfrpg?.combatType || "normal";
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

    const header = html.find('.combat-tracker-header');
    const footer = html.find('.directory-footer');

    // Return whether the difficulty tracker should be displayed
    const diffDisplay = game.settings.get("sfrpg", "difficultyDisplay");
    const diffObject = new CombatDifficulty(activeCombat);

    if (activeCombat.round) {
        const phases = activeCombat.getPhases();
        if (phases.length > 1) {
            activeCombat.renderCombatPhase(html[0]);
        }
    } else {
        // Add buttons for switching combat type
        activeCombat.renderCombatTypeControls(html[0]);

        // Add difficulty calculator display if needed
        if (activeCombat.getCombatType() === "normal" && game.user.isGM && diffDisplay) {
            diffObject.getNormalEncounterInfo();
        } else if (activeCombat.getCombatType() === "starship" && game.user.isGM && diffDisplay) {
            diffObject.getStarshipEncounterInfo();
        }

        activeCombat.renderDifficulty(diffObject, html[0]);

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

        const difficultyButton = header.find('.combat-difficulty');
        difficultyButton.click(async ev => {
            ev.preventDefault();
            diffObject.render(true);
        });
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
        bodyHeader: `SFRPG.Combat.ChatCards.Round.BodyHeader`
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
