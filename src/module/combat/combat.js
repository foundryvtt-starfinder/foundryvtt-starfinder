export class CombatSFRPG extends Combat {
    async begin() {
        console.log('beginning combat');
        console.log(this);
    
        let phases = [
            {
                name: "Combat",
                iterateTurns: true,
                resetInitiative: false,
                sortInitiative: "desc",
            }
        ];
    
        const combatType = this.data.data?.combatType || "normal";
        if (combatType === "starship") {
            phases = [
                {
                    name: "Engineering",
                    iterateTurns: false,
                    resetInitiative: false,
                    sortInitiative: null,
                },
                {
                    name: "Helm (Piloting)",
                    iterateTurns: false,
                    resetInitiative: true,
                    sortInitiative: null,
                },
                {
                    name: "Helm (Execution)",
                    iterateTurns: true,
                    resetInitiative: false,
                    sortInitiative: "asc",
                },
                {
                    name: "Gunnery",
                    iterateTurns: true,
                    resetInitiative: false,
                    sortInitiative: null,
                },
                {
                    name: "Damage",
                    iterateTurns: false,
                    resetInitiative: false,
                    sortInitiative: null,
                }
            ];    
        } else if (combatType === "vehicleChase") {
            phases = [
                {
                    name: "Piloting",
                    iterateTurns: true,
                    resetInitiative: false,
                    sortInitiative: "desc",
                },
                {
                    name: "Chase progress",
                    iterateTurns: false,
                    resetInitiative: false,
                    sortInitiative: null,
                },
                {
                    name: "Combat",
                    iterateTurns: true,
                    resetInitiative: false,
                    sortInitiative: null,
                }
            ];    
        }
    
        const update = {
            "data.combatType": combatType,
            "data.phase": 0,
            "data.phases": phases
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
    
        await super.nextTurn();
    }

    async previousRound() {
        console.log('previous round');
        console.log(this);
    
        const oldRound = this.data.round;
        const oldPhase = this.data.data.phase;
        const oldTurn = this.data.turn;
    
        const newRound = Math.max(1, oldRound - 1);
        const newPhase = 0;
        const newTurn = 0; // TODO: Skip defeated, if phases[newPhase].iterateTurns
    
        const update = {
            round: newRound,
            "data.phase": newPhase,
            turn: newTurn
        };
    
        await this.update(update);
    
        await this._handlePhaseStart();
    }

    async nextRound() {
        console.log('next round');
        console.log(this);
    
        const oldRound = this.data.round;
        const oldPhase = this.data.data.phase;
        const oldTurn = this.data.turn;
    
        const newRound = Math.max(1, oldRound + 1);
        const newPhase = 0;
        const newTurn = 0; // TODO: Skip defeated, if phases[newPhase].iterateTurns
    
        const update = {
            round: newRound,
            "data.phase": newPhase,
            turn: newTurn
        };
    
        await this.update(update);
    
        await this._handlePhaseStart();
    }

    async _handlePhaseStart() {
        const currentPhaseIndex = this.data.data.phase;
        const currentPhase = this.data.data.phases[currentPhaseIndex];
    
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

    const combatType = combat.data.data?.combatType || "normal";
    const types = ["normal", "starship", "vehicleChase"];
    const indexOf = types.indexOf(combatType);
    const wrappedIndex = (indexOf + 1) % types.length;
    
    const update = {
        "data.combatType": types[wrappedIndex]
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