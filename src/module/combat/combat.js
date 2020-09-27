async function onConfigClicked(combat) {
    console.log('config combat');
    console.log(combat);

    const combatType = combat.data.sfrpg?.combatType || "normal";
    const types = ["normal", "starship", "vehicleChase"];
    const indexOf = types.indexOf(combatType);
    const wrappedIndex = (indexOf + 1) % types.length;
    
    const update = {
        "sfrpg.combatType": types[wrappedIndex]
    };
    await combat.update(update);
    console.log(`Combat is now of type ${types[wrappedIndex]}`);
}

async function onBeginClicked(combat) {
    console.log('beginning combat');
    console.log(combat);

    let phases = [
        {
            name: "Combat",
            iterateTurns: true,
            resetInitiative: false,
            sortInitiative: "desc",
        }
    ];

    const combatType = combat.data.sfrpg?.combatType || "normal";
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
        "sfrpg.combatType": combatType,
        "sfrpg.phase": 0,
        "sfrpg.phases": phases
    };

    await combat.update(update);
    
    //Hooks.call("onCombatStart")
}

async function upgradeExistingCombat(combat) {
    if (combat.data.sfrpg == undefined) {
        const phases = [
            {
                name: "Combat",
                iterateTurns: true,
                resetInitiative: false,
                sortInitiative: "desc",
            }
        ];

        const update = {
            "sfrpg.combatType": "normal",
            "sfrpg.phase": 0,
            "sfrpg.phases": phases
        };

        await combat.update(update);
    }
}

async function handlePhaseStart(combat) {
    const currentPhaseIndex = combat.data.sfrpg.phase;
    const currentPhase = combat.data.sfrpg.phases[currentPhaseIndex];

    console.log(`Starting phase: ${currentPhase}`);

    if (currentPhase.resetInitiative) {
        for (let combatant of combat.combatants) {
            await combat.setInitative(combatant._id, null);
        }
    }
    
    if (currentPhase.sortInitiative) {
        let turns = duplicate(combat.turns);
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
        await combat.update({turns: turns});
    }
}

async function onPreviousRoundClicked(combat) {
    console.log('previous round');
    console.log(combat);

    await upgradeExistingCombat(combat);

    const oldRound = combat.data.round;
    const oldPhase = combat.data.sfrpg.phase;
    const oldTurn = combat.data.turn;

    const newRound = Math.max(1, oldRound - 1);
    const newPhase = 0;
    const newTurn = 0; // TODO: Skip defeated, if phases[newPhase].iterateTurns

    const update = {
        round: newRound,
        "sfrpg.phase": newPhase,
        turn: newTurn
    };

    await combat.update(update);

    await handlePhaseStart(combat);
}

async function onPreviousTurnClicked(combat) {
    console.log('previous turn');
    console.log(combat);

    await combat.previousTurn();
}

async function onNextTurnClicked(combat) {
    console.log('next turn');
    console.log(combat);

    await combat.nextTurn();
}

async function onNextRoundClicked(combat) {
    console.log('next round');
    console.log(combat);

    await upgradeExistingCombat(combat);

    const oldRound = combat.data.round;
    const oldPhase = combat.data.sfrpg.phase;
    const oldTurn = combat.data.turn;

    const newRound = Math.max(1, oldRound + 1);
    const newPhase = 0;
    const newTurn = 0; // TODO: Skip defeated, if phases[newPhase].iterateTurns

    const update = {
        round: newRound,
        "sfrpg.phase": newPhase,
        turn: newTurn
    };

    await combat.update(update);

    await handlePhaseStart(combat);
}

Hooks.on('renderCombatTracker', (app, html, data) => {
    const activeCombat = data.combat;
    if (!activeCombat) {
        return;
    }

    const footer = html.find('.directory-footer');
    const isRunning = (activeCombat.data.round > 0 || activeCombat.data.turn > 0);
    if (isRunning) {
        // Replace next/prev turn logic
        const prevRound = footer.find('.combat-control[data-control=previousRound]');
        prevRound.off('click');
        prevRound.click(event => {
            event.preventDefault();
            onPreviousRoundClicked(activeCombat);
        });

        const prevTurn = footer.find('.combat-control[data-control=previousTurn]');
        prevTurn.off('click');
        prevTurn.click(event => {
            event.preventDefault();
            onPreviousTurnClicked(activeCombat);
        });

        const nextTurn = footer.find('.combat-control[data-control=nextTurn]');
        nextTurn.off('click');
        nextTurn.click(event => {
            event.preventDefault();
            onNextTurnClicked(activeCombat);
        });

        const nextRound = footer.find('.combat-control[data-control=nextRound]');
        nextRound.off('click');
        nextRound.click(event => {
            event.preventDefault();
            onNextRoundClicked(activeCombat);
        });
    } else {
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
            onBeginClicked(activeCombat);
        });
    }
});