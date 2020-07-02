import { CounterManagementWindows } from "./counter-management-windows.js";

/**
 * Helper class to handle rendering the custom combat tracker.
 */
export default class CounterManagement {
    constructor() {
        this.existingFeature = ['solarianAttunement', 'vanguardEntropy', 'soldierKi'];
        this.currentActor = null;
        this.counterClasses = {};
        this.counter = {
            'solarianAttunement': 0,
            'vanguardEntropy': 0,
            'soldierKi': 0,
        };
        this.initDone = false;
        this.currentRound = -1;
        this.windowsBox = null;
    }

    // This must be called in the `init` hook in order for the other hooks to
    // fire correctly.
    startup() {
        // Re-render combat when actors are modified.
        Hooks.on('updateActor', (actor, data, options, id) => {
            ui.combat.render();
        });

        Hooks.on('updateToken', (scene, token, data, options, id) => {
            ui.combat.render();
        });

        // TODO: Replace this hack that triggers an extra render.
        Hooks.on('renderSidebar', (app, html, options) => {
            ui.combat.render();
        });

        // When the combat tracker is rendered, we need to completely replace
        // its HTML with a custom version.
        Hooks.on('renderCombatTracker', async (app, html, options) => {
            // If there's as combat, we can proceed.
            // Retrieve a list of the combatants grouped by actor type and sorted
            // by their initiative count.
            let combatants = this.getCombatantsData();

            //if the combat have started, and we have reset the counter we can proceed
            if (game.combat && this.initDone) {
                /**
                 * Display the right icon inside the
                 */
                 combatants.forEach(c => {
                    // Add class to trigger drag events.
                    this.currentActor = game.actors.get(c.actor._id);

                    let $combatant = html.find(`.combatant[data-combatant-id="${c._id}"]`);
                    let featureCounterActivated = this.howManyClassesWithCounterHaveTheActor(c);

                    //We manage today only actor with
                    if(featureCounterActivated.count == 1 ) {
                        const currentClasses = featureCounterActivated.classesToManage[0];
                        //Init counter if neeeded
                        this.initCounterClasses(this.currentActor,currentClasses);
                        $combatant.addClass('counter-image-relative');
                        //Must be done only one time for each combattant
                        if(game.combat.data.round > this.currentRound) {
                            this.addOneToCounterForActiveActor(c, currentClasses);
                        }
                        $combatant.find('.token-image').after("<div class='counter-token-management'><div class='counter-token'><p>"+this.getCurrentCounter(currentClasses)+"</p><img class='counter-token-image' data-actor-id='"+c.actor._id+"' data-actor-classe='"+currentClasses+"' src='systems/sfrpg/icons/classes/"+this.getCurrentClassesOrPosition(currentClasses)+".png' /></div></div>");

                        //Display the dialogue box to manage the right class
                        html.find('.counter-token-image').click(event => {
                            this.displayDialogBoxCounterManagement(c.actor._id, currentClasses, c._id);
                        });

                    }else if(featureCounterActivated.count > 1) {
                        //Todo need to change the design part with a rollover windows with multiple counter
                        //Todo Need to merge this part with the if == 1
                        //TODO - Counter Management Classes - More than one classe with counter tracker"
                    }
                });

                 //get the last round
                this.currentRound = game.combat.data.round;

            }else if(!this.initDone){
                //Reset all counter if the combat is not started
                combatants.forEach(c => {
                    this.resetCounterManagement(c.actor._id);
                });
                this.initDone = true;
                this.currentRound = -1;
            }

            let nextTurn = html.find('.combat-control[data-control=endCombat]');
            nextTurn.click(event => {
                combatants.forEach(c => {
                    let featureCounterActivated = this.howManyClassesWithCounterHaveTheActor(c);
                    if(featureCounterActivated.count >= 1 ) {
                        this.resetCounterManagement(c.actor._id);
                    }
                });
                this.initDone = false;
                this.currentRound = -1;
            })
        });

    }

    /**
     * Reset the all counter for all classes for the current ActorId
     * @param actorId
     */
    resetCounterManagement(actorId){
        let currentActor = game.actors.get(actorId);
        currentActor.update({
            "data.counterClasses.values": []
        });
    }

    /**
     * Get the counter for the targetted classes
     * @param classesToManage
     * @returns {*}
     */
    getCurrentCounter(classesToManage){
        return (this.currentActor.data.data.counterClasses.values[classesToManage])
            ?  this.currentActor.data.data.counterClasses.values[classesToManage].count
            : 0;
    }

    /**
     * Get the counter for the targetted classes
     * @param classesToManage
     * @returns {*}
     */
    getCurrentClassesOrPosition(classesToManage){
        return (this.currentActor.data.data.counterClasses.values[classesToManage])
            ?  this.currentActor.data.data.counterClasses.values[classesToManage].position
            : classesToManage;
    }

    /**
     * Add one to the counter of the choosen classes
     * @param classesToManage
     */
    addOneToCurrentCounter(classesToManage){
        if(this.currentActor.data.data.counterClasses.values[classesToManage]) {
            let classesToUpdate = {};
            classesToUpdate[classesToManage] = {
                'count': this.currentActor.data.data.counterClasses.values[classesToManage].count + 1,
                'position': this.getCurrentClassesOrPosition(classesToManage),
            };
            this.currentActor.update({
                "data.counterClasses.values": classesToUpdate
            });
        }
    }

    /**
     * First init and migrate data when the combat start
     * @param actor
     * @param classesToManage
     */
    initCounterClasses(actor, classesToManage) {
        if (!this.currentActor.data.data.counterClasses.values[classesToManage]) {
            let classesToUpdate = {};
            classesToUpdate[classesToManage] = {'count': 0, 'position': this.getCurrentClassesOrPosition(classesToManage)};
            actor.update({
                "data.counterClasses.values": classesToUpdate
            });
        }
    }

    /**
     * Add one for the couner of the active actor inside the combat after the combat start
     * Manage the special rules for the solarian, it can't growth the counter over 3
     * @param combatant
     * @param targetClasses
     */
    addOneToCounterForActiveActor(combatant, targetClasses){
        //If the actor is the active actor inside the combat we add one to the counter one time.
        if(combatant.active && game.combat && game.combat.data.round > 0){
            //limit to tree for solarian
            if(!this.isSolarian(targetClasses) || this.getCurrentCounter(targetClasses) < 3) {
                this.addOneToCurrentCounter(targetClasses);
            } else if (this.isSolarian(targetClasses)){
                this.activePixiEffect(combatant._id);
            }
        }
    }

    /**
     * Active visual effect for the solarian, when i can activated a final power
     * @param combattantId
     */
    activePixiEffect(combattantId){
        //Todo active PixiEffect
    }

    /**
     * The actor have activated the solarian feature
     * @param targetClasses
     * @returns {boolean}
     */
    isSolarian(targetClasses){
        return (targetClasses == "solarianAttunement");
    }

    /**
     * Get how many the actor have special counter classes activated
     * @param c
     * @returns {{count: number, classesToManage: Array}}
     */
    howManyClassesWithCounterHaveTheActor(c){

        let classesTracker = {
            'count': 0,
            'classesToManage':[]
        };

        if(typeof c.actor.data.flags.sfrpg != "undefined") {
            let activeFeature = c.actor.data.flags.sfrpg;

            for (let [key, name] of Object.entries(this.existingFeature)) {
                if (activeFeature.hasOwnProperty(name)){
                    classesTracker.count++;
                    classesTracker['classesToManage'].push(name);
                }
            }

            return classesTracker;
        }

        return classesTracker;
    }

    /**
     * Display the dialog box when the user click on the icon displayed inside the combat tracker related
     * to the right classes
     * @param actorId
     * @param targetClasses
     * @param combatantId
     * @returns {Promise<void>}
     */
    async displayDialogBoxCounterManagement(actorId, targetClasses, combatantId){
        this.windowsBox = await CounterManagementWindows.create(actorId, targetClasses, combatantId);
    }

    /**
     * Retrieve a list of combatants for the current combat.
     *
     * Combatants will be sorted into groups by actor type. Set the
     * updateInitiative argument to true to reassign init numbers.
     * @param {Boolean} updateInitiative
     */
    getCombatantsData(updateInitiative = false) {
        // If there isn't a combat, exit and return an empty array.
        if (!game.combat || !game.combat.data) {
            return [];
        }

        let combatants = game.combat.data.combatants.map(combatant => {
            // If this is for a combatant that has had its token/actor deleted,
            // remove it from the combat.
            if (!combatant.actor) {
                game.combat.deleteCombatant(combatant._id);
            }

            // Return the updated group.
            return combatant;
        });

        // Return the list of combatants.
        return combatants;
    }
}