/**
 * A class for checking the difficulty of the currently defined combat
 *
 * @type {Application}
 */
export class CombatDifficulty extends Application {
    constructor(combatData, options = {}) {
        super(combatData, options);
        this.options.classes = ["sfrpg", "application"];

        this.combatData = combatData;
    }

    getStarshipEncounterInfo() {
        // Performs starship encounter difficulty calculations and populates data storage location
        if (!this.difficultyData) {
            this.difficultyData = {};
        }

        const [playerShips, playerShipTiers, enemyShips, enemyShipTiers] = this.parseShips();
        this.difficultyData.playerShips = playerShips;
        this.difficultyData.playerShipTiers = playerShipTiers;
        this.difficultyData.enemyShips = enemyShips;
        this.difficultyData.enemyShipTiers = enemyShipTiers;

        const [playerTierEffective, playerTierRound, playerTierString] = this.calculatePlayerShipEffectiveTier(playerShipTiers);
        this.difficultyData.playerTier = {};
        this.difficultyData.playerTier.effective = playerTierEffective;
        this.difficultyData.playerTier.round = playerTierRound;
        this.difficultyData.playerTier.string = playerTierString;

        const [enemyTierEffective, enemyTierRound, enemyTierString] = this.calculateEnemyShipEffectiveTier(enemyShipTiers);
        this.difficultyData.enemyTier = {};
        this.difficultyData.enemyTier.effective = enemyTierEffective;
        this.difficultyData.enemyTier.round = enemyTierRound;
        this.difficultyData.enemyTier.string = enemyTierString;

        const [difficulty, XPValue, wealth] = this.calculateShipChallenge();
        this.difficultyData.difficulty = difficulty;
        this.difficultyData.XPValue = XPValue;
        this.difficultyData.wealth = wealth;
    }

    parseShips() {
        let playerShips = [];
        let playerShipTiers = [];
        let enemyShips = [];
        let enemyShipTiers = [];

        // split combatants into allies and enemies
        for (const combatant of this.combatData.combatants) {
            if (combatant.actor.type === "starship") {
                if (combatant.hasPlayerOwner) {
                    playerShips.push(combatant);
                    playerShipTiers.push(combatant.actor.system.details.tier);
                } else if (combatant.token.disposition < 0) {
                    enemyShips.push(combatant);
                    enemyShipTiers.push(combatant.actor.system.details.tier);
                }
            }
        }

        return [playerShips, playerShipTiers, enemyShips, enemyShipTiers];
    }

    calculatePlayerShipEffectiveTier(shipTiers) {
        const sortedTiers = shipTiers.sort().reverse(); // sort high to low
        const highestShipTier = sortedTiers[0];
        let tierEffective = highestShipTier;

        if (sortedTiers.length > 1) {
            // count the number of starships within 2 Tiers of the highest one
            let withinTwo = -1;
            for (const num of sortedTiers) {
                if (num >= highestShipTier - 2) {
                    withinTwo += 1;
                }
            }

            // If there are any ships within 2 tiers of the highest one, add one to the effective tier for each of them
            // Otherwise, sum the remaining ships' tiers and add 1 if the value is equal to or greater than the highest ship's tier
            if (withinTwo > 0) {
                tierEffective += withinTwo;
            } else {
                const sum = sortedTiers.reduce((partialSum, a) => partialSum + a, 0) - highestShipTier;
                if (sum >= highestShipTier) {
                    tierEffective += 1;
                }
            }
        }

        // Calculate other versions of the tier (number, rounded, string)
        let tierRound = tierEffective;
        let tierString = "";

        if (tierEffective > 1) {
            tierRound = Math.floor(tierEffective);
        }
        switch (tierRound) {
            case 0.25:
                tierString = "1/4";
                break;
            case 1 / 3:
                tierString = "1/3";
                break;
            case 0.5:
                tierString = "1/2";
                break;
            default:
                tierString = String(tierRound);
        }
        return [tierEffective, tierRound, tierString];
    }

    calculateEnemyShipEffectiveTier(shipTiers) {
        const sortedTiers = shipTiers.sort().reverse(); // sort high to low
        const highestShipTier = sortedTiers[0];
        const numShips = shipTiers.length;
        let tierEffective = highestShipTier;

        if (numShips > 1) {
            if (sortedTiers[1] === sortedTiers[0]) {
                tierEffective += 2;
                if (numShips > 2) {
                    if (sortedTiers[2] === sortedTiers[0]) {
                        tierEffective += 1;
                        if (numShips > 3) {
                            if (sortedTiers[3] === sortedTiers[0]) {
                                return this.calculatePlayerShipEffectiveTier(shipTiers);
                            }
                        }
                    }
                }
            } else {
                return this.calculatePlayerShipEffectiveTier(shipTiers);
            }
        }

        // Calculate other versions of the tier (number, rounded, string)
        let tierRound = tierEffective;
        let tierString = "";

        // Round down if it's not an allowed fractional value (between 0 and 1)
        if (tierEffective > 1) {
            tierRound = Math.floor(tierEffective);
        }
        switch (tierRound) {
            case 0.25:
                tierString = "1/4";
                break;
            case 1 / 3:
                tierString = "1/3";
                break;
            case 0.5:
                tierString = "1/2";
                break;
            default:
                tierString = String(tierRound);
        }
        return [tierEffective, tierRound, tierString];
    }

    /**
     * Calculate the difficulty of the combat encounter
     * @returns {[string, number, number]}
     */
    calculateShipChallenge() {

        const CRTable = CONFIG.SFRPG.CRTable;
        const numPlayerShips = this.difficultyData.playerShips.length;
        const numEnemyShips = this.difficultyData.enemyShips.length;
        const playerEffectiveTier = this.difficultyData.playerTier.effective;
        const enemyNumericalTier = this.difficultyData.enemyTier.round;
        const enemyStringTier = this.difficultyData.enemyTier.string;

        // Check that Players and NPCs are both present
        if (!numPlayerShips) {
            return ["noPCShips", 0, 0];
        } else if (!numEnemyShips) {
            return ["noEnemyShips", 0, 0];
        }

        // Calculate Difficulty Table
        const diffTable = [
            {"difficulty": "easy", "tier": playerEffectiveTier - 3},
            {"difficulty": "average", "tier": playerEffectiveTier - 2},
            {"difficulty": "challenging", "tier": playerEffectiveTier - 1},
            {"difficulty": "hard", "tier": playerEffectiveTier},
            {"difficulty": "epic", "tier": playerEffectiveTier + 1}
        ];

        // Round down if the tier in the table is a non-integer that isn't allowed
        for (const row of diffTable) {
            if (row.tier < 0 || row.tier > 1) {
                row.tier = Math.floor(row.tier);
            }
        }

        // Calculate the Encounter Difficulty
        let encounterDifficulty = "";

        if (enemyNumericalTier < diffTable[0].tier) {
            encounterDifficulty = "lessThanEasy";
        } else if (enemyNumericalTier > diffTable[4].tier) {
            encounterDifficulty = "greaterThanEpic";
        } else {
            for (const diffRow of diffTable) {
                if (enemyNumericalTier === diffRow.tier) {
                    encounterDifficulty = diffRow.difficulty;
                }
            }
        }

        return [encounterDifficulty, CRTable[enemyStringTier].totalXP, CRTable[enemyStringTier].wealthValue];
    }

    /**
     * Performs all encounter difficulty calculations for normal combat
     */
    getNormalEncounterInfo() {
        if (!this.difficultyData) {
            this.difficultyData = {};
        }

        const [PCs, APL] = this.calculateAPL();
        this.difficultyData.PCs = PCs;
        this.difficultyData.APL = APL;

        const [enemies, enemyXP] = this.calculateEnemyXP();
        this.difficultyData.enemies = enemies;
        this.difficultyData.enemyXP = enemyXP;

        const [CR, XPArray, difficulty, playerXP, wealth] = this.calculateChallenge();
        this.difficultyData.CR = CR;
        this.difficultyData.CRXPbounds = [XPArray.minXP, XPArray.totalXP];
        this.difficultyData.CRXPboundsString = `${XPArray.minXP} – ${XPArray.totalXP}`;
        this.difficultyData.difficulty = difficulty;
        this.difficultyData.playerXP = playerXP;
        this.difficultyData.wealth = wealth;

        this.difficultyData.leftoverCR = this.calculateLeftoverCR();
    }

    /**
     * Calculates the APL of the players in a combat
     * @returns {[Combatant[], number]}
     */
    calculateAPL() {
        const average = (array) => array.reduce((total, value) => total + value, 0) / array.length;

        let playerCombatants = [];
        let playerLevels = [];

        // Find all player-owned PCs and get their levels
        for (const combatant of this.combatData.combatants) {
            if (combatant.actor.type === "character") {
                if (combatant.players.length > 0) {
                    playerCombatants.push(combatant);
                    playerLevels.push(combatant.actor.system.details.level.value);
                }
            }
        }

        // Calculate APL
        if (!playerCombatants.length) {
            return [playerCombatants, 0];
        } else if (playerCombatants.length < 4) {
            return [playerCombatants, Math.round(average(playerLevels)) - 1];
        } else if (playerCombatants.length > 5) {
            return [playerCombatants, Math.round(average(playerLevels)) + 1];
        } else {
            return [playerCombatants, Math.round(average(playerLevels))];
        }
    }

    /**
     * Calculates the sum of enemy XP values in a combat
     * @return {[Combatant[], number]}
    */
    calculateEnemyXP() {
        let enemyCombatants = [];
        let enemyXP = [];

        // Find all player-owned PCs and get their levels
        for (const combatant of this.combatData.combatants) {
            if (combatant.actor.type === "npc2" || combatant.actor.type === "npc") {
                if (combatant.isNPC) {
                    if (combatant.token.disposition < 0) {
                        enemyCombatants.push(combatant);
                        enemyXP.push(combatant.actor.system.details.xp.value); // Enemy XP values
                    }
                }
            }
        }
        return [enemyCombatants, enemyXP.reduce((partialSum, a) => partialSum + a, 0)];
    }

    /**
     * Calculates combat encounter CR, difficulty, and XP value
     * @returns {[number, object, string, number, number]}
     */
    calculateChallenge() {
        const CRTable = CONFIG.SFRPG.CRTable;
        const APL = this.difficultyData.APL;
        const numPlayers = this.difficultyData.PCs.length;
        const numEnemies = this.difficultyData.enemies.length;
        const XPtotal = this.difficultyData.enemyXP;

        // Check that Players and NPCs are both present
        if (!numPlayers) {
            return ["0", CRTable["0"], "noPcs", 0];
        } else if (!numEnemies) {
            return ["0", CRTable["0"], "noEnemies", 0];
        }

        // Calculate XP and compare to XP table to get CR and wealth value
        let encounterCR = 0;
        let XParray = {};

        // Error checking
        if (XPtotal > CRTable["25"].totalXP) {
            console.log("Error, encounter CR > 25.");
            XParray = CRTable["25"];
            encounterCR = "25";
        } else {
            for (let [CR, XProw] of Object.entries(CRTable)) {
                // Figure out encounter difficulty
                if (XPtotal <= XProw.totalXP) {
                    if (XPtotal > XProw.minXP) {
                        XParray = XProw;
                        encounterCR = CR;
                        break;
                    }
                }
            }
        }

        // Calculate Difficulty Table
        const diffTable = [
            {"difficulty": "easy", "CR": APL - 1},
            {"difficulty": "average", "CR": APL},
            {"difficulty": "challenging", "CR": APL + 1},
            {"difficulty": "hard", "CR": APL + 2},
            {"difficulty": "epic", "CR": APL + 3}
        ];

        // Calculate a numerical version of the CR for comparison
        const CRsplit = encounterCR.split("/");
        let numCR = 0;
        if (CRsplit.length === 2) {
            numCR = Number(CRsplit[0]) / Number(CRsplit[1]);
        } else {
            numCR = Number(CRsplit[0]);
        }

        // Calculate the Encounter Difficulty
        let encounterDifficulty = "";

        if (numCR < diffTable[0].CR) {
            encounterDifficulty = "lessThanEasy";
        } else if (numCR > diffTable[4].CR) {
            encounterDifficulty = "greaterThanEpic";
        } else {
            for (const diffRow of diffTable) {
                if (numCR === diffRow.CR) {
                    encounterDifficulty = diffRow.difficulty;
                }
            }
        }

        // Calculate individual XP based on number of party members
        let perPlayerXP = 0;

        if (numPlayers < 4) {
            perPlayerXP = XParray.perPlayerXP[0];
        } else if (numPlayers > 5) {
            perPlayerXP = XParray.perPlayerXP[2];
        } else {
            perPlayerXP = XParray.perPlayerXP[1];
        }

        return [encounterCR, XParray, encounterDifficulty, perPlayerXP, XParray.wealthValue];
    }

    /**
     *  Calculate the CR value of the strongest enemy that can be added to the encounter without changing CR
     * @returns {String}
     */
    calculateLeftoverCR() {
        const enemyXP = this.difficultyData.enemyXP;
        const remainingXP = this.difficultyData.CRXPbounds[1] - enemyXP;
        const CRTable = CONFIG.SFRPG.CRTable;

        if (!remainingXP) {
            return "0";
        } else if (remainingXP > CRTable["25"].totalXP) {
            return "25";
        } else {
            // Find the CR value of the remaining XP, without going over
            for (let [CR, XProw] of Object.entries(CRTable)) {
                if (remainingXP < XProw.nextXP) {
                    if (remainingXP >= XProw.totalXP) {
                        return CR;
                    }
                }
            }

            return "0";
        }
    }

    renderDifficulty() {
        const difficulty = this.difficultyData.difficulty;
        const combatType = this.combatData.flags.sfrpg.combatType;

        let difficultyContainer = document.createElement("div");
        difficultyContainer.classList.add("combat-difficulty-container");

        let difficultyHTML = document.createElement("a");
        difficultyHTML.classList.add("combat-difficulty", difficulty);
        if (combatType === 'normal') {
            difficultyHTML.title = `${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.PCs")}: ${this.difficultyData.PCs.length} [${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.APL")} ${this.difficultyData.APL}]\n${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.HostileNPCs")}: ${this.difficultyData.enemies.length} [${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.CR")} ${this.difficultyData.CR}]`;
        } else if (combatType === 'starship') {
            difficultyHTML.title = game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.ClickForDetails");
        }
        difficultyHTML.innerHTML = `Difficulty: ${CONFIG.SFRPG.difficultyLevels[difficulty]}`;

        difficultyContainer.appendChild(difficultyHTML);
        document.getElementsByClassName('combat-tracker-header')[0].appendChild(difficultyContainer);
    }

}
