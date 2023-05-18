/**
 * A class for checking the difficulty of the currently defined combat
 *
 * @type {Application}
 */
export class CombatDifficulty extends Application {
    difficultyData = {};

    constructor(combatData, options = {}) {
        super(combatData, options);
        this.combatData = combatData;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "encounter-stats";
        options.classes = ["sfrpg"];
        options.width = "auto";
        options.height = "auto";
        return options;
    }

    get title() {
        const title = `${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.Details")}: ${CONFIG.SFRPG.difficultyLevels[this.difficultyData.difficulty]} ${game.i18n.format("SFRPG.Combat.Difficulty.Tooltip.DifficultyEncounter")}`;
        return title;
    }

    get template() {
        const isStarship = this.combatData.flags.sfrpg.combatType === "starship";
        return `systems/sfrpg/templates/apps/${isStarship ? "starship" : "normal"}-encounter-stats.hbs`;
    }

    getData() {
        return this;
    }

    activateListeners(html) {
        html.find("li.combatant-list").on("click", (event) => this._onCombatantClick(event));
    }

    async _onCombatantClick(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.combatantId;
        const actor = game.combat.combatants.get(id).actor;

        actor.sheet.render(true);
    }

    async render(force, options = {}) {
        // Ensure this data is up to date, particularly important when the combat tracker re-renders
        if (this.combatData.getCombatType() === "normal") this.getNormalEncounterInfo();
        else if (this.combatData.getCombatType() === "starship") this.getStarshipEncounterInfo();

        if (!(this.appId in game.combat.apps)) game.combat.apps[this.appId] = this;
        super.render(force, options);
    }

    async close(options = {}) {
        delete game.combat.apps[this.appId];
        super.close(options);
    }

    getStarshipEncounterInfo() {
        // Performs starship encounter difficulty calculations and populates data storage location

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
                } else if (combatant?.token?.disposition < 0) {
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

        const [PCs, APL] = this.calculateAPL();
        this.difficultyData.PCs = PCs;
        this.difficultyData.APL = APL;

        const [enemies, enemyXP] = this.calculateEnemyXP();
        this.difficultyData.enemies = enemies;
        this.difficultyData.enemyXP = enemyXP;

        const [CR,
            XPArray,
            difficulty,
            arrayPlayerXP,
            wealth,
            divPlayerXP] = this.calculateChallenge();
        this.difficultyData.CR = CR;
        this.difficultyData.CRXPbounds = [XPArray.minXP, XPArray.totalXP];
        this.difficultyData.CRXPboundsString = `${XPArray.minXP} – ${XPArray.totalXP}`;
        this.difficultyData.difficulty = difficulty;
        this.difficultyData.arrayPlayerXP = arrayPlayerXP;
        this.difficultyData.divPlayerXP = divPlayerXP;
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
                    if (combatant?.token?.disposition < 0) {
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
                if (XPtotal <= XProw.totalXP && XPtotal > XProw.minXP) {
                    XParray = XProw;
                    encounterCR = CR;
                    break;
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

        // Calculate XP per player based on the table on CRB pg. 390.
        let arrayPerPlayerXP = 0;

        if (numPlayers < 4) {
            arrayPerPlayerXP = XParray.perPlayerXP[0];
        } else if (numPlayers > 5) {
            arrayPerPlayerXP = XParray.perPlayerXP[2];
        } else {
            arrayPerPlayerXP = XParray.perPlayerXP[1];
        }

        // Calculate XP per player by dividing total XP by the number of players (Calculate these both since the rules say both are valid)
        const divPerPlayerXP = Math.floor(XPtotal / numPlayers);

        return [encounterCR, XParray, encounterDifficulty, arrayPerPlayerXP, XParray.wealthValue, divPerPlayerXP];
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

}
