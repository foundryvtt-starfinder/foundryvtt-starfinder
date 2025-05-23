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

export class CombatSFRPG extends foundry.documents.Combat {
    static HiddenTurn = 0;

    /**
     * The current initiative count of the encounter
     */
    get initiative() {
        if (!this.started) return null;
        return this.combatant?.initiative;
    }

    _preCreate(data, options, user) {
        const update = {
            "flags.sfrpg.combatType": this.getCombatType(),
            "flags.sfrpg.phase": 0
        };

        this.updateSource(update);
        return super._preCreate(data, options, user);
    }

    async begin() {
        const update = {
            "flags.sfrpg.combatType": this.getCombatType(),
            "flags.sfrpg.phase": 0,
            "round": 1,
            "turn": 0
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

    // Override to account for ascending or descending turn order.
    setupTurns() {
        this.turns ||= [];

        const sortMethod = {
            "normal": CombatSFRPG.normalCombat.initiativeSorting,
            "starship": CombatSFRPG.starshipCombat.initiativeSorting,
            "vehicleChase": CombatSFRPG.vehicleChase.initiativeSorting
        }[this.getCombatType()] || "desc";

        const turns = this.combatants.contents.sort(sortMethod === "asc" ? this._sortCombatantsAsc : this._sortCombatants);
        this.turn = Math.clamp(this.turn, CombatSFRPG.HiddenTurn, turns.length - 1);

        // Update state tracking
        const c = turns[this.turn];
        this.current = this._getCurrentState(c);

        // One-time initialization of the previous state
        if ( !this.previous ) this.previous = this.current;

        return this.turns = turns;
    }

    async previousTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        let nextRound = this.round;
        let nextPhase = this.flags.sfrpg.phase;
        let nextTurn = this.turn - 1;

        const updateOptions = {};
        const currentPhase = this.getCurrentPhase();
        if (currentPhase.resetInitiative) {
            ui.notifications.error(CombatSFRPG.errors.historyLimitedResetInitiative, {permanent: false, localize: true});
            return;
        }

        if (currentPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
                nextTurn = -1;
                for (const [index, combatant] of turnEntries) {
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
                    ui.notifications.error(CombatSFRPG.errors.historyLimitedStartOfEncounter, {permanent: false, localize: true});
                    return;
                }
            }

            const round = Math.max(this.round - 1, 0);
            let advanceTime = -1 * (this.turn || 0) * CONFIG.time.turnTime;
            if ( round > 0 ) advanceTime -= CONFIG.time.roundTime;
            updateOptions.advanceTime = advanceTime;
            updateOptions.direction = -1;
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

        await this._handleUpdate(nextRound, nextPhase, nextTurn, updateOptions);
    }

    async nextTurn() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        let nextRound = this.round;
        let nextPhase = this.flags.sfrpg.phase;
        let nextTurn = this.turn + 1;

        const updateOptions = {};
        const phases = this.getPhases();
        const currentPhase = phases[this.flags.sfrpg.phase];
        if (currentPhase.resetInitiative && this.hasCombatantsWithoutInitiative()) {
            ui.notifications.error(CombatSFRPG.errors.missingInitiative, {permanent: false, localize: true});
            return;
        }

        if (currentPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                for (const [index, combatant] of this.turns.entries()) {
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

            const advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
            updateOptions.advanceTime = advanceTime + CONFIG.time.roundTime;
            updateOptions.direction = 1;
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

        await this._handleUpdate(nextRound, nextPhase, nextTurn, updateOptions);
    }

    async previousRound() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        const indexOfFirstUndefeatedCombatant = this.getIndexOfFirstUndefeatedCombatant();

        let nextRound = this.round;
        const nextPhase = 0;
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

        const round = Math.max(this.round - 1, 0);
        let advanceTime = -1 * (this.turn || 0) * CONFIG.time.turnTime;
        if ( round > 0 ) advanceTime -= CONFIG.time.roundTime;

        await this._handleUpdate(nextRound, nextPhase, nextTurn, {advanceTime, direction: -1});
    }

    async nextRound() {
        if (this.isEveryCombatantDefeated()) {
            return;
        }

        const indexOfFirstUndefeatedCombatant = this.getIndexOfFirstUndefeatedCombatant();

        const nextRound = this.round + 1;
        const nextPhase = 0;
        let nextTurn = 0;

        const phases = this.getPhases();
        const newPhase = phases[nextPhase];
        if (newPhase.iterateTurns) {
            if (this.settings.skipDefeated) {
                nextTurn = indexOfFirstUndefeatedCombatant;
            }
        }

        const advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;

        await this._handleUpdate(nextRound, nextPhase, nextTurn, {advanceTime: advanceTime + CONFIG.time.roundTime, direction: 1});
    }

    async _handleUpdate(nextRound, nextPhase, nextTurn, updateOptions = {}) {
        const phases = this.getPhases();
        const currentPhase = phases[this.flags.sfrpg.phase];
        const newPhase = phases[nextPhase];

        const eventData = {
            combat: this,
            isNewRound: nextRound !== this.round,
            isNewPhase: nextPhase !== this.flags.sfrpg.phase,
            isNewTurn: (nextRound !== this.round && phases[nextPhase].iterateTurns) || nextTurn !== this.turn,
            oldTurn: this.turn,
            newTurn: nextTurn,
            oldRound: this.round,
            newRound: nextRound,
            oldPhase: currentPhase,
            newPhase: newPhase,
            oldCombatant: currentPhase.iterateTurns ? this.turns[this.turn] : null,
            newCombatant: newPhase.iterateTurns ? this.turns[nextTurn] : null,
            direction: updateOptions.direction || nextRound - this.round || nextTurn - this.turn
        };

        if (!eventData.isNewRound && !eventData.isNewPhase && !eventData.isNewTurn) {
            return;
        }

        Hooks.callAll("onBeforeUpdateCombat", eventData);

        if (!newPhase.iterateTurns) {
            nextTurn = CombatSFRPG.HiddenTurn;
        }

        const updateData = {
            round: nextRound,
            "flags.sfrpg.phase": nextPhase,
            turn: nextTurn
        };

        updateOptions["eventData"] = eventData;

        await this.update(updateData, updateOptions);

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

    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);

        // Get an active GM to run events players may not have permissions to do.
        if (!game.users.activeGM?.isSelf) return;

        // Handle timed events if the event that is occurring is phase/round/turn advance.
        if (options.eventData) {
            this._handleTimedEffects(options.eventData);
        }
    }

    /**
     * Run turn start turn events. This runs only for an active GM. If there are no GMs, this isn't run.
     * @param {Combatant} combatant The Combatant whose turn just started
     */
    async _onStartTurn(combatant) {
        super._onStartTurn(combatant);

        combatant.actor?._onTurnStart();
    }

    /**
     * Run turn end turn events. This runs only for an active GM. If there are no GMs, this isn't run.
     * @param {Combatant} combatant The Combatant whose turn just ended
     */
    async _onEndTurn(combatant) {
        super._onEndTurn(combatant);

        combatant.actor?._onTurnEnd();
    }

    async _notifyAfterUpdate(eventData) {

        const combatType = this.getCombatType();
        const combatChatSetting = game.settings.get('sfrpg', `${combatType}ChatCards`);

        if (eventData.isNewRound && (combatChatSetting !== "disabled" || combatChatSetting === "roundsTurns")) {
            await this._printNewRoundChatCard(eventData);
        }

        if (eventData.isNewPhase && (combatChatSetting === "enabled" || combatChatSetting === "roundsPhases")) {
            await this._printNewPhaseChatCard(eventData);
        }

        if (eventData.newCombatant && (combatChatSetting === "enabled" || combatChatSetting === "roundsTurns")) {
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
                image: "systems/sfrpg/icons/cards/rolling-dices.svg",
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
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
            speaker: ChatMessage.getSpeaker({ actor: eventData.newCombatant, token: eventData.newCombatant?.token, alias: speakerName }),
            content: html
        };

        await ChatMessage.create(chatData, { displaySheet: false });
    }

    async _printNewPhaseChatCard(eventData) {
        const localizedCombatName = this.getCombatName();
        const localizedPhaseName = game.i18n.format(eventData.newPhase.name);
        const phaseIcon = CONFIG.SFRPG.phaseIcons[eventData.newPhase.name];

        // Basic template rendering data
        const speakerName = game.i18n.format(CombatSFRPG.chatCardsText.speaker.GM);
        const templateData = {
            header: {
                image: phaseIcon,
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
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
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
            type: CONST.CHAT_MESSAGE_STYLES.OTHER,
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
        for (const [index, combatant] of this.turns.entries()) {
            if ((!this.settings.skipDefeated || !combatant.defeated) && (combatant.initiative === undefined || combatant.initiative === null)) {
                return true;
            }
        }
        return false;
    }

    getIndexOfFirstUndefeatedCombatant() {
        for (const [index, combatant] of this.turns.entries()) {
            if (!combatant.defeated) {
                return index;
            }
        }
        return null;
    }

    getIndexOfLastUndefeatedCombatant() {
        const turnEntries = Array.from(new Set(this.turns.entries())).reverse();
        for (const [index, combatant] of turnEntries) {
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
        const phaseDisplay = document.createElement("h4");
        phaseDisplay.classList.add("combat-type");
        phaseDisplay.innerHTML = game.i18n.format(this.getCurrentPhase().name);
        html.getElementsByClassName('combat-tracker-header')[0].appendChild(phaseDisplay);
    }

    renderCombatTypeControls(html) {
        const prevCombatTypeButton = `<a class="combat-type-prev" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectPrevType")}"><i class="fas fa-caret-left"></i></a>`;
        const nextCombatTypeButton = `<a class="combat-type-next" title="${game.i18n.format("SFRPG.Combat.EncounterTracker.SelectNextType")}"><i class="fas fa-caret-right"></i></a>`;

        const combatTypeControls = document.createElement("div");
        combatTypeControls.classList.add("combat-type");

        if (game.user.isGM) {
            combatTypeControls.innerHTML = `${prevCombatTypeButton} &nbsp; ${this.getCombatName()} &nbsp; ${nextCombatTypeButton}`;
        } else {
            combatTypeControls.innerHTML = this.getCombatName();
        }

        html.appendChild(combatTypeControls);
    }

    renderDifficulty(diffObject, html) {
        const difficulty = diffObject.difficultyData.difficulty;
        const combatType = this.getCombatType();

        const difficultyContainer = document.createElement("div");
        difficultyContainer.classList.add("combat-difficulty-container");

        const difficultyHTML = document.createElement("a");
        difficultyHTML.classList.add("combat-difficulty");
        if (difficulty) difficultyHTML.classList.add(difficulty);
        if (combatType === 'normal') {
            difficultyHTML.title = `${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.ClickForDetails")}\n\n${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.PCs")}: ${diffObject.difficultyData.PCs.length} [${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.APL")} ${diffObject.difficultyData.APL}]\n${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.HostileNPCs")}: ${diffObject.difficultyData.enemies.length} [${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.CR")} ${diffObject.difficultyData.CR}]`;
        } else if (combatType === 'starship') {
            difficultyHTML.title = game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.ClickForDetails");
        }
        difficultyHTML.innerHTML = `Difficulty: ${CONFIG.SFRPG.difficultyLevels[difficulty]}`;

        difficultyContainer.appendChild(difficultyHTML);
        html.getElementsByClassName('combat-tracker-header')[0].appendChild(difficultyContainer);
    }

    _getInitiativeFormula(combatant) {
        if (this.getCombatType() === "starship") {
            if (!combatant.actor.system.crew.useNPCCrew) {
                return "1d20 + @pilot.skills.pil.mod + @ship.attributes.pilotingBonus.value";
            }
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
            if (!combatant.actor.system.crew.useNPCCrew) {
                rollContext.addContext("ship", combatant.actor);
                parts.push("@ship.attributes.pilotingBonus.value");
            }
            rollContext.setMainContext("pilot");
        } else {
            parts.push("@combatant.attributes.init.total");
            if (game.settings.get("sfrpg", "useInitiativeTiebreaker")) {
                parts.push(combatant.actor.system.attributes.init.total / 100);
            }
        }

        const rollResult = await DiceSFRPG.createRoll({
            rollContext: rollContext,
            actorContextKey: "combatant",
            parts: parts,
            event,
            title: game.i18n.format("SFRPG.Rolls.InitiativeRollFull", {name: combatant.actor.name})
        });

        rollResult.roll.flags = { sfrpg: { finalFormula: rollResult.formula } };
        return rollResult.roll;
    }

    async rollInitiative(ids, {formula = null, updateTurn = true, messageOptions = {}} = {}) {

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        const defaultRollMode = game.settings.get("core", "rollMode");
        let rollMode = messageOptions.rollMode ?? defaultRollMode;

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        let isFirst = true;
        for (const id of ids) {
            // Get Combatant data
            const combatant = this.combatants.get(id);
            if ( !combatant?.isOwner ) return results;

            // If starship combat and no pilot initiative is just ship piloting bonuses
            if (this.getCombatType() === "starship" && combatant.actor.type === "starship"
                && ((!combatant.actor.system.crew.useNPCCrew && combatant.actor.system.crew.pilot.actorIds.length === 0)
                    || (combatant.actor.system.crew.useNPCCrew && !combatant.actor.system.crew.npcData.pilot.skills.pil))
            ) {
                updates.push({_id: id, initiative: combatant.actor.system.attributes.pilotingBonus.value});
                continue;
            }

            // Roll initiative
            const roll = await this._getInitiativeRoll(combatant, "");
            if (!roll) {
                continue;
            }
            updates.push({_id: id, initiative: roll.total});

            // Construct chat message data
            const messageData = foundry.utils.mergeObject({
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
            const insertIndex = rollContent.indexOf(`</div>\r\n            <section class="tooltip-part">`);
            const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);

            rollMode = roll.options?.rollMode ?? rollMode;

            const chatData = {
                flavor: messageData.flavor,
                speaker: messageData.speaker,
                flags: messageData.flags,
                content: explainedRollContent,
                rollMode: combatant.hidden && rollMode === CONST.DICE_ROLL_MODES.PUBLIC && defaultRollMode === CONST.DICE_ROLL_MODES.PUBLIC ? "gmroll" : rollMode,
                rolls: [roll],
                type: CONST.CHAT_MESSAGE_STYLES.OTHER,
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
        await messages.forEach(message => {
            ChatMessage.create(message, { rollMode: message.rollMode });
        });

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
        const ci = ia - ib;
        if ( ci !== 0 ) return ci;
        const [an, bn] = [a.token?.name || "", b.token?.name || ""];
        const cn = an.localeCompare(bn);
        if ( cn !== 0 ) return cn;
        return a.tokenId - b.tokenId;
    }

    _handleTimedEffects(eventData) {
        const timedEffects = game.sfrpg.timedEffects;
        const forward = eventData.direction > 0;

        for (const effect of timedEffects.values()) {
            const duration = effect.activeDuration;
            if (duration.unit === 'permanent') continue;

            const worldTime = game.time.worldTime;
            const effectStart = duration.activationTime;
            const effectFinish = duration.activationEnd;
            const expiryInit = duration.expiryInit || 1000; // If anything goes wrong, expire at the start of the round
            const targetActorId = (() => {
                /** @type {"parent"|"origin"|"init"|ActorID} */
                const expiryModeTurn = duration.expiryMode.turn;

                // Expire on the owner's turn
                if (expiryModeTurn === "parent") {
                    const id = effect.actor?.id;
                    if (id) return id;
                }

                // Expire on the origin actor's turn; fall back to owner
                else if (expiryModeTurn === "origin") {
                    const id = effect.origin?.id || effect.actor?.id;
                    if (id) return id;
                }

                // Turn closest to initiative to expire on
                else if (expiryModeTurn === "init") return this.combatants.contents.sort(this._sortCombatants).find(c => c.initiative <= expiryInit).actorId;

                // Otherwise, an actor id of a specific combatant
                else return expiryModeTurn;
            })();

            if (((worldTime >= effectFinish) && effect.enabled) // If effect has expired
                || ((effectStart <= worldTime) && (effectFinish >= worldTime) && !effect.enabled)) { // If the current turn has gone back, and the effect has un-expired.
                if (!eventData.isNewTurn) continue;
                if (!eventData.combat.combatants.find(combatant => combatant.actorId === targetActorId)) {
                    effect.toggle(false);
                    continue;
                }

                if (duration.expiryMode.type === "turn") {
                    if (duration.endsOn === 'onTurnEnd') {
                        if ((forward && eventData.oldCombatant.actorId === targetActorId) || (!forward && eventData.newCombatant.actorId === targetActorId)) {
                            effect.toggle(false);
                        }
                    // On turn start
                    } else {
                        if ((forward && eventData.newCombatant.actorId === targetActorId) || (!forward && eventData.oldCombatant.actorId === targetActorId)) {
                            effect.toggle(false);
                        }
                    }
                // Expire by initiative
                } else {
                    if ((forward && eventData.oldCombatant.initiative >= expiryInit && eventData.newCombatant.initiative <= expiryInit) || (!forward && eventData.newCombatant.initiative >= expiryInit && eventData.oldCombatant.initiative <= expiryInit)) {
                        effect.toggle(false);
                    }
                }

            }

        }
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

Hooks.on('combatStart', (combat) => {
    combat.begin();
});

Hooks.on('renderCombatTracker', (app, html, data) => {
    const activeCombat = data.combat;
    if (!activeCombat) {
        return;
    }

    const combatType = activeCombat.getCombatType();

    const header = html.querySelector('.combat-tracker-header');
    const footer = html.querySelector('.combat-controls');

    if (activeCombat.round > 0) {
        const phases = activeCombat.getPhases();
        if (phases.length > 1) {
            activeCombat.renderCombatPhase(html);
        }
    } else {
        // Add buttons for switching combat type
        activeCombat.renderCombatTypeControls(header);

        // Handle button clicks
        const configureButtonPrev = header.querySelector('.combat-type-prev');
        configureButtonPrev.addEventListener('click', ev => {
            ev.preventDefault();
            onConfigClicked(activeCombat, -1);
        });

        const configureButtonNext = header.querySelector('.combat-type-next');
        configureButtonNext.addEventListener('click', ev => {
            ev.preventDefault();
            onConfigClicked(activeCombat, 1);
        });
    }

    // Perform difficulty calculations, and display if appropriate
    if (game.user.isGM && combatType !== "vehicleChase") {
        const diffDisplay = game.settings.get("sfrpg", "difficultyDisplay");
        if (!diffDisplay) return;

        const diffObject = new CombatDifficulty(activeCombat);

        if (combatType === "normal") diffObject.getNormalEncounterInfo();
        else if (combatType === "starship") diffObject.getStarshipEncounterInfo();

        // Display difficulty
        activeCombat.renderDifficulty(diffObject, html);

        // Handle button presses
        const difficultyButton = header.querySelector('.combat-difficulty');
        difficultyButton.addEventListener('click', ev => {
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
