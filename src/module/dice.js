
import SFRPGCustomChatMessage from "./chat/chatbox.js";

export class DiceSFRPG {
    /**
   * A standardized helper function for managing core Starfinder "d20 rolls"
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
   *
   * @param {Event} event           The triggering event which initiated the roll
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {Actor} actor           The Actor making the d20 roll
   * @param {Object} data           Actor or item data against which to parse the roll
   * @param {String} title          The dice roll UI window title
   * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
   * @param {Boolean} advantage     Allow rolling with advantage (and therefore also with disadvantage)
   * @param {Number} critical       The value of d20 result which represents a critical success
   * @param {Number} fumble         The value of d20 result which represents a critical failure
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {Object} dialogOptions  Modal dialog options
   */
    static d20Roll({ event = new Event(''), parts, data, actor, title, speaker, flavor, advantage = true,
        critical = 20, fumble = 1, onClose, dialogOptions }) {
        
        flavor = flavor || title;

        /** New roll formula system */
        const buttons = {};
        if (game.settings.get("sfrpg", "useAdvantageDisadvantage") && advantage) {
            buttons["Disadvantage"] = {label: "Disadvantage"};
            buttons["Normal"] = {label: "Normal"};
            buttons["Advantage"] = {label: "Advantage"};
        } else {
            buttons["Normal"] = {label: "Normal"};
        }

        const options = {
            debug: true,
            buttons: buttons,
            defaultButton: "Normal",
            title: title,
            skipUI: event?.shiftKey || game.settings.get('sfrpg', 'useQuickRollAsDefault'),
            mainDie: "1d20",
            dialogOptions: dialogOptions
        };

        const formula = parts.join(" + ");// + " + @gunner.abilities.str.mod";
        const contexts = {
            main: {entity: actor, data: data}//,
            //gunner1: {entity: actor, data: data},
            //gunner2: {entity: actor, data: data}
        };
        /*let gunnerCount = 1;
        for (const gunnerActor of actor.data.data.crew.gunner.actors) {
            contexts["gunner" + gunnerCount] = {entity: gunnerActor, data: gunnerActor.data.data};
            gunnerCount += 1;
        }*/
        const selectors = [
            //{target: "gunner", options: ["gunner1", "gunner2"]}
        ];
        const tree = new RollTree(options);
        tree.buildRoll(formula, {allContexts: contexts, selectors: selectors, mainContext: "main"}, (button, rollMode, finalFormula) => {
            let dieRoll = "1d20";
            if (button === "Disadvantage") {
                dieRoll = "2d20kl";
            } else if (button === "Advantage") {
                dieRoll = "2d20kh";
            }

            finalFormula.finalRoll = dieRoll + " + " + finalFormula.finalRoll;
            finalFormula.formula = dieRoll + " + " + finalFormula.formula;

            let roll = new Roll(finalFormula.finalRoll).roll();

            // Flag critical thresholds
            for (let d of roll.dice) {
                if (d.faces === 20) {
                    d.options.critical = critical;
                    d.options.fumble = fumble;
                }
            }

            if (game.settings.get("sfrpg", "useCustomChatCard")) {
                //Push the roll to the ChatBox
                const customData = {
                    'title': title,
                    'data':  data,
                    'actor': actor,
                    'flavor': flavor,
                    'speaker': speaker,
                    'rollMode': rollMode
                };

                const action = title.replace(/\s/g, '-').toLowerCase();

                SFRPGCustomChatMessage.renderStandardRoll(roll, customData, action);
            } else {
                roll.toMessage({
                    speaker: speaker,
                    flavor: flavor,
                    rollMode: rollMode
                });
            }

            if (onClose) {
                onClose(roll, formula, finalFormula);
            }
        });
    }

    /* -------------------------------------------- */

    /**
    * A standardized helper function for managing core 5e "d20 rolls"
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
    *
    * @param {Event} event           The triggering event which initiated the roll
    * @param {Array} parts           The dice roll component parts, excluding the initial d20
    * @param {Object} criticalData   Critical damage information, in case of a critical hit
    * @param {Array} damageTypes     Array of damage types associated with this roll
    * @param {Actor} actor           The Actor making the damage roll
    * @param {Object} data           Actor or item data against which to parse the roll
    * @param {String} title          The dice roll UI window title
    * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
    * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
    * @param {Boolean} critical      Allow critical hits to be chosen
    * @param {Function} onClose      Callback for actions to take when the dialog form is closed
    * @param {Object} dialogOptions  Modal dialog options
    */
    static damageRoll({ event = new Event(''), parts, criticalData, damageTypes, actor, data, title, speaker, flavor, critical = true, onClose, dialogOptions }) {
        flavor = flavor || title;

        /** New roll formula system */
        const buttons = {
            Normal: { label: "Normal" },
            Critical: { label: "Critical" }
        };

        const options = {
            debug: true,
            buttons: buttons,
            defaultButton: "Normal",
            title: title,
            skipUI: event?.shiftKey || game.settings.get('sfrpg', 'useQuickRollAsDefault'),
            mainDie: "",
            dialogOptions: dialogOptions
        };

        const formula = parts.join(" + ");
        const contexts = {main: {entity: actor, data: data}};
        const tree = new RollTree(options);
        tree.buildRoll(formula, {allContexts: contexts, mainContext: "main"}, (button, rollMode, finalFormula) => {
            if (button === "Critical") {
                finalFormula.finalRoll = finalFormula.finalRoll + " + " + finalFormula.finalRoll;
                finalFormula.formula = finalFormula.formula + " + " + finalFormula.formula;
                
                flavor = `${title} (Critical)`;

                if (criticalData !== undefined) {
                    flavor = `${title} (Critical; ${criticalData.effect})`;

                    let critRoll = criticalData.parts.filter(x => x[0].length > 0).map(x => x[0]).join("+");
                    if (critRoll.length > 0) {
                        finalFormula.finalRoll = finalFormula.finalRoll + " + " + critRoll;
                        finalFormula.formula = finalFormula.formula + " + " + critRoll;
                    }
                }
            }

            let roll = new Roll(finalFormula.finalRoll).roll();
            
            // Associate the damage types for this attack to the first DiceTerm
            // for the roll. 
            const die = roll.dice && roll.dice.length > 0 ? roll.dice[0] : null;
            if (die) {
                die.options.isDamageRoll = true;
                die.options.damageTypes = damageTypes;
                die.options.isModal = data.item.properties.modal || data.item.properties.double;
            }

            // Flag critical thresholds
            for (let d of roll.dice) {
                if (d.faces === 20) {
                    d.options.critical = critical;
                    d.options.fumble = fumble;
                }
            }

            if (game.settings.get("sfrpg", "useCustomChatCard")) {
                //Push the roll to the ChatBox
                const customData = {
                    'title': title,
                    'data':  data,
                    'actor': actor,
                    'flavor': flavor,
                    'speaker': speaker,
                    'rollMode': rollMode
                };

                const action = title.replace(/\s/g, '-').toLowerCase();

                SFRPGCustomChatMessage.renderStandardRoll(roll, customData, action);
            } else {
                roll.toMessage({
                    speaker: speaker,
                    flavor: flavor,
                    rollMode: rollMode
                });
            }

            if (onClose) {
                onClose(roll, formula, finalFormula);
            }
        });
    }

    static highlightCriticalSuccessFailure(message, html, data) {
        if (!message.isRoll || !message.isContentVisible) return;
    
        let roll = message.roll;
        if (!roll.dice.length) return;
        for (let d of roll.dice) {
            if (d.faces === 20 && d.results.length === 1) {
                if (d.total >= (d.options.critical || 20)) html.find('.dice-total').addClass('success');
                else if (d.total <= (d.options.fumble || 1)) html.find('.dice-total').addClass('failure');
            }
        }
    }

    /**
     * Add damage types for damage rolls to the chat card.
     * 
     * @param {ChatMessage} message The chat message
     * @param {JQuery}      html    The html of the chat message
     */
    static addDamageTypes(message, html) {
        if (!message.isRoll || !message.isContentVisible) return;

        const roll = message.roll;
        if (!roll?.dice.length > 0) return;
        const die = roll.dice[0];

        if (die?.options?.isDamageRoll) {
            const types = die?.options?.damageTypes;
        }
    }
}

class RollTree {
    constructor(options = {}) {
        this.rootNode = null;
        this.nodes = {};
        this.options = options;
    }

    async buildRoll(formula, contexts, callback) {
        this.formula = formula;
        this.contexts = contexts;

        /** Initialize selectors. */
        if (this.contexts.selectors) {
            for (const selector of this.contexts.selectors) {
                const selectorTarget = selector.target;
                const firstValue = selector.options[0];
                if (selectorTarget && firstValue) {
                    this.contexts.allContexts[selectorTarget] = this.contexts.allContexts[firstValue];
                }
            }
        }

        const allRolledMods = this.populate();

        return this.displayUI(formula, contexts, allRolledMods).then(([button, rollMode, bonus]) => {
            if (button === null) {
                console.log('Roll was cancelled');
                return;
            }

            for (const [key, value] of Object.entries(this.nodes)) {
                if (value.referenceModifier) {
                    value.isEnabled = value.referenceModifier.enabled;
                }
            }

            const finalRollFormula = this.rootNode.resolve();
            if (bonus) {
                finalRollFormula.finalRoll += " + " + bonus;
                finalRollFormula.formula += " + [Additional Bonus]";
            }

            if (this.options.debug) {
                console.log([`Final roll results outcome`, formula, allRolledMods, finalRollFormula]);
            }

            callback(button, rollMode, finalRollFormula);
        });
    }

    populate() {
        if (this.options.debug) {
            console.log(`Resolving '${this.formula}'`);
            console.log(duplicate(this.contexts));
        }
        this.rootNode = new RollNode(this, this.formula, null, null, false, true);
        this.nodes = {};

        this.nodes[this.formula] = this.rootNode;
        this.rootNode.populate(this.nodes, this.contexts);
        
        const allRolledMods = RollTree.getAllRolledModifiers(this.nodes);
        const availableModifiers = (this.options.additionalModifiers || []).concat(allRolledMods.map(x => x.referenceModifier));
        return availableModifiers;
    }

    async displayUI(formula, contexts, availableModifiers) {
        if (this.options.debug) {
            console.log(["Available modifiers", availableModifiers]);
        }
        if (this.options.skipUI) {
            const firstButton = this.options.defaultButton || (this.options.buttons ? Object.values(this.options.buttons)[0].label : "Roll");
            const defaultRollMode = game.settings.get("core", "rollMode");
            return new Promise((resolve) => { resolve([firstButton, defaultRollMode, ""]); });
        }
        return RollDialog.showRollDialog(this, formula, contexts, availableModifiers, this.options.mainDie, {buttons: this.options.buttons, defaultButton: this.options.defaultButton, title: this.options.title, dialogOptions: this.options.dialogOptions});
    }

    static getAllRolledModifiers(nodes) {
        return Object.values(nodes).filter(x => x.referenceModifier !== null);
    }
}

class RollNode {
    constructor(tree, formula, baseValue, referenceModifier, isVariable, isEnabled) {
        this.tree = tree;
        this.formula = formula;
        this.baseValue = baseValue;
        this.referenceModifier = referenceModifier;
        this.isVariable = isVariable;
        this.isEnabled = isEnabled;
        this.resolvedValue = undefined;
        this.childNodes = {};
    }
        
    populate(nodes, contexts) {
        if (this.isVariable) {
            const [context, remainingVariable] = RollNode.getContextForVariable(this.formula, contexts);
            const availableRolledMods = RollNode.getRolledModifiers(remainingVariable, context);

            for (const mod of availableRolledMods) {
                const modKey = mod.bonus.name;

                let existingNode = nodes[modKey];
                if (!existingNode) {
                    const childNode = new RollNode(this.tree, mod.bonus.modifier, null, mod.bonus, false, mod.bonus.enabled);
                    nodes[modKey] = childNode;
                    existingNode = childNode;
                }
                this.childNodes[modKey] = existingNode;
            }
        }
        else {
            const variableMatches = new Set(this.formula.match(/@([a-zA-Z.0-9_\-]+)/g));
            for (const fullVariable of variableMatches) {
                const variable = fullVariable.substring(1);
                const [context, remainingVariable] = RollNode.getContextForVariable(variable, contexts);
                const variableValue = RollNode._readValue(context.data, remainingVariable);

                let existingNode = nodes[variable];
                if (!existingNode) {
                    const childNode = new RollNode(this.tree, variable, variableValue, null, true, true);
                    nodes[variable] = childNode;
                    existingNode = childNode;
                }
                this.childNodes[variable] = existingNode;
            }
        }

        for (const childNode of Object.values(this.childNodes)) {
            childNode.populate(nodes, contexts);
        }
    }
            
    resolve(depth = 0) {
        if (this.resolvedValue) {
            return this.resolvedValue;
        } else {
            //console.log(['Resolving', depth, this]);
            this.resolvedValue = {
                finalRoll: "",
                formula: ""
            };

            const enabledChildNodes = Object.values(this.childNodes).filter(x => x.isEnabled);

            if (this.baseValue) {
                this.resolvedValue.finalRoll = this.baseValue;
                this.resolvedValue.formula = "@" + this.formula;

                // formula
                for (const childNode of enabledChildNodes) {
                    const childResolution = childNode.resolve(depth + 1);
                    if (this.resolvedValue.finalRoll !== "") {
                        this.resolvedValue.finalRoll += " + ";
                    }
                    this.resolvedValue.finalRoll += childResolution.finalRoll;

                    if (this.resolvedValue.formula !== "") {
                        this.resolvedValue.formula += " + ";
                    }
                    this.resolvedValue.formula += childNode.referenceModifier ? `[${childNode.referenceModifier.name}]` : childResolution.formula;
                }
            } else {
                let valueString = this.formula;
                let formulaString = this.formula;
                const variableMatches = new Set(formulaString.match(/@([a-zA-Z.0-9_\-]+)/g));
                for (const fullVariable of variableMatches) {
                    const regexp = new RegExp(fullVariable, "gi");
                    const variable = fullVariable.substring(1);
                    const existingNode = this.childNodes[variable];
                    //console.log(["testing var", depth, this, fullVariable, variable, existingNode]);
                    if (existingNode) {
                        const childResolution = existingNode.resolve(depth + 1);
                        valueString = valueString.replace(regexp, childResolution.finalRoll);
                        formulaString = formulaString.replace(regexp, childResolution.formula);
                        //console.log(['Result', depth, childResolution, valueString, formulaString]);
                    } else {
                        //console.log(['Result', depth, "0"]);
                        valueString = valueString.replace(regexp, "0");
                        formulaString = formulaString.replace(regexp, "0");
                    }
                }

                this.resolvedValue.finalRoll = valueString;
                this.resolvedValue.formula = formulaString;
            }
            //console.log(["Resolved", depth, this, this.resolvedValue]);
            return this.resolvedValue;
        }
    }
            
    static getContextForVariable(variable, contexts) {
        const firstToken = variable.split('.')[0];

        if (contexts.allContexts[firstToken]) {
            return [contexts.allContexts[firstToken], variable.substring(firstToken.length + 1)];
        }

        const context = (contexts.mainContext ? contexts.allContexts[contexts.mainContext] : null);
        //console.log(["getContextForVariable", variable, contexts, context]);
        return [context, variable];
    }
        
    static getRolledModifiers(variable, context) {
        let variableString = variable + ".rolledMods";
        let variableRolledMods = RollNode._readValue(context.data, variableString);
        if (!variableRolledMods) {
            variableString = variable.substring(0, variable.lastIndexOf('.')) + ".rolledMods";
            variableRolledMods = RollNode._readValue(context.data, variableString);
        }
        //console.log(["getRolledModifiers", variable, context, variableString, variableRolledMods]);
        return variableRolledMods || []
    }

    static _readValue(object, key) {
        //console.log(["_readValue", key, object]);
        if (!object || !key) return null;

        const tokens = key.split('.');
        for (const token of tokens) {
            object = object[token];
            if (!object) return null;
        }

        return object;
    }
}

class RollDialog extends Dialog
{
    constructor(rollTree, formula, contexts, availableModifiers, mainDie, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog", "roll"];

        this.rollTree = rollTree;
        this.formula = formula;
        this.contexts = contexts;
        this.availableModifiers = availableModifiers;
        if (mainDie) {
            this.formula = mainDie + " + " + formula;
        }

        /** Prepare selectors */
        this.selectors = {};
        if (this.contexts.selectors) {
            for (const selector of this.contexts.selectors) {
                this.selectors[selector.target] = {
                    values: selector.options,
                    value: selector.options[0]
                };

                const entries = {};
                for (const selectorValue of selector.options) {
                    entries[selectorValue] = this.contexts.allContexts[selectorValue].entity.name;
                }
                this.selectors[selector.target].entries = entries;
            }
        }

        /** Returned values */
        this.additionalBonus = "";
        this.rollMode = game.settings.get("core", "rollMode");
        this.rolledButton = null;
    }

    get template() {
        return "systems/sfrpg/templates/chat/roll-dialog.html";
    }

    getData() {
        let data = super.getData();
        data.formula = this.formula;
        data.rollmode = this.rollMode;
        data.rollModes = CONFIG.Dice.rollModes;
        data.additionalBonus = this.additionalBonus;
        data.availableModifiers = this.availableModifiers || [];
        data.hasModifiers = data.availableModifiers.length > 0;
        data.hasSelectors = this.contexts.selectors && this.contexts.selectors.length > 0;
        data.selectors = this.selectors;
        data.contexts = this.contexts;
        return data;
    }
    
    activateListeners(html) {
        super.activateListeners(html);

        let additionalBonusTextbox = html.find('input[name=bonus]');
        additionalBonusTextbox.bind('change', this._onAdditionalBonusChanged.bind(this));

        let rollModeCombobox = html.find('select[name=rollMode]');
        rollModeCombobox.bind('change', this._onRollModeChanged.bind(this));

        let modifierEnabled = html.find('.toggle-modifier');
        modifierEnabled.bind('click', this._toggleModifierEnabled.bind(this));

        let selectorCombobox = html.find('.selector');
        selectorCombobox.bind('change', this._onSelectorChanged.bind(this));
    }

    async _onAdditionalBonusChanged(event) {
        this.additionalBonus = event.target.value;
    }

    async _onRollModeChanged(event) {
        this.rollMode = event.target.value;
    }

    async _toggleModifierEnabled(event) {
        const modifierIndex = $(event.currentTarget).parents('.modifier').data('modifierIndex');
        const modifier = this.availableModifiers[modifierIndex];

        modifier.enabled = !modifier.enabled;
        this.render(false);

        // Update container
        const container = modifier.container;
        const actor = await game.actors.get(container.actorId);
        if (container.itemId) {
            const item = container.itemId ? await actor.getOwnedItem(container.itemId) : null;

            // Update modifier by ID in item
            const containerModifiers = duplicate(item.data.data.modifiers);
            const modifierToUpdate = containerModifiers.find(x => x._id === modifier._id);
            modifierToUpdate.enabled = modifier.enabled;
            await item.update({"data.modifiers": containerModifiers});
        } else {
            // Update modifier by ID in actor
            const containerModifiers = duplicate(actor.data.data.modifiers);
            const modifierToUpdate = containerModifiers.find(x => x._id === modifier._id);
            modifierToUpdate.enabled = modifier.enabled;
            await actor.update({"data.modifiers": containerModifiers});
        }
    }

    async _onSelectorChanged(event) {
        const selectorName = event.target.name;
        const selectedValue = event.target.value;

        console.log(`${selectorName} now set to ${selectedValue}`);
        this.selectors[selectorName].value = selectedValue;
        this.contexts.allContexts[selectorName] = this.contexts.allContexts[selectedValue];
        
        /** Repopulate nodes, might change modifiers because of different selector. */
        this.availableModifiers = this.rollTree.populate();
        
        this.render(false);
    }

    submit(button) {
        try {
            this.rolledButton = button.label;
            this.close();
        } catch(err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }
    
    async close(options) {
        /** Fire callback, then delete, as it would get called again by Dialog#close. */
        this.data.close(this.rolledButton, this.rollMode, this.additionalBonus);
        delete this.data.close;

        return super.close(options);
    }

    static async showRollDialog(rollTree, formula, contexts, availableModifiers = [], mainDie, options = {}) {
        return new Promise(resolve => {
            const buttons = options.buttons || { roll: { label: "Roll" } };
            const firstButtonLabel = options.defaultButton || Object.values(buttons)[0].label;

            const dlg = new RollDialog(rollTree, formula, contexts, availableModifiers, mainDie, {
                title: options.title || "Roll",
                buttons: buttons,
                default: firstButtonLabel,
                close: (button, rollMode, bonus) => {
                    resolve([button, rollMode, bonus]);
                }
            }, options.dialogOptions || {});
            dlg.render(true);
        });
    }
}
