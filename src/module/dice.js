
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
   * @param {String} template       The HTML template used to render the roll dialog
   * @param {String} title          The dice roll UI window title
   * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
   * @param {Boolean} advantage     Allow rolling with advantage (and therefore also with disadvantage)
   * @param {Boolean} situational   Allow for an arbitrary situational bonus field
   * @param {Boolean} fastForward   Allow fast-forward advantage selection
   * @param {Number} critical       The value of d20 result which represents a critical success
   * @param {Number} fumble         The value of d20 result which represents a critical failure
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {Object} dialogOptions  Modal dialog options
   */
    static d20Roll({ event = new Event(''), parts, data, actor, template, title, speaker, flavor, advantage = true, situational = true,
        fastForward = true, critical = 20, fumble = 1, onClose, dialogOptions }) {

        flavor = flavor || title;
        const autoFastForward = game.settings.get('sfrpg', 'useQuickRollAsDefault');
        if (event && autoFastForward) {
            event.shiftKey = autoFastForward;
        }
        // Inner roll function
        let rollMode = game.settings.get("core", "rollMode");
        let roll = (parts, adv) => {
            if (adv === 1) {
                parts[0] = ["2d20kh"];
                flavor = `${title} (Advantage)`;
            }
            else if (adv === -1) {
                parts[0] = ["2d20kl"];
                flavor = `${title} (Disadvantage)`;
            }

            // Don't include situational bonus unless it is defined
            if (!data.bonus && parts.indexOf("@bonus") !== -1) parts.pop();

            // Execute the roll
            let roll = new Roll(parts.join(" + "), data).roll();
            const action = title.replace(/\s/g, '-').toLowerCase();

             //My data to display
            let myData = {
                'title': title,
                'data':  data,
                'actor': actor,
                'flavor': flavor,
                'speaker': speaker,
                'rollMode': rollMode
            };

            // Flag critical thresholds
            for (let d of roll.dice) {
                if (d.faces === 20) {
                    d.options.critical = critical;
                    d.options.fumble = fumble;
                }
            }

            if (game.settings.get("sfrpg", "useCustomChatCard")) {
                //Push the roll to the ChatBox
                SFRPGCustomChatMessage.renderStandardRoll(roll, myData, action);
            } else {
                roll.toMessage({
                    speaker: speaker,
                    flavor: flavor,
                    rollMode: rollMode
                });
            }

            return roll;
        };

        let dialogCallback = html => {
            if (onClose) onClose(html, parts, data);
            rollMode = html.find('[name="rollMode"]').val();
            data['bonus'] = html.find('[name="bonus"]').val();
            if (data['bonus'].trim() === "") delete data['bonus'];
            return roll(parts, adv);
        };

        // Modify the roll and handle fast-forwarding
        parts = ["1d20"].concat(parts);
        // Check for shift key last, so that alt and ctrl keys can
        // still be captured in case the auto fast-forward setting
        // is enabled.
        if (event.altKey) return Promise.resolve(roll(parts, 1));
        else if (event.ctrlKey || event.metaKey) return Promise.resolve(roll(parts, -1));
        else if (event.shiftKey) return Promise.resolve(roll(parts, 0));
        else parts = parts.concat(["@bonus"]);

        // Render modal dialog
        template = template || "systems/sfrpg/templates/chat/roll-dialog.html";
        const useAdvantage = game.settings.get("sfrpg", "useAdvantageDisadvantage");
        let templateData = {
            formula: parts.join(" + "),
            data: data,
            rollMode: rollMode,
            rollModes: CONFIG.Dice.rollModes
        };        

        let adv = 0;

        return new Promise(resolve => {
            renderTemplate(template, templateData).then(dlg => {
                new Dialog({
                    title: title,
                    content: dlg,
                    buttons: {
                        advantage: {
                            label: "Advantage",
                            condition: useAdvantage,
                            callback: html => {
                                adv = 1;
                                resolve(dialogCallback(html));
                            }
                        },
                        normal: {
                            label: useAdvantage ? "Normal" : "Roll",
                            callback: html => {
                                resolve(dialogCallback(html));
                            }
                        },
                        disadvantage: {
                            label: "Disadvantage",
                            condition: useAdvantage,
                            callback: html => {
                                adv = -1; 
                                resolve(dialogCallback(html));
                            }
                        }
                    },
                    default: "normal",
                    close: () => {
                        // noop
                    }
                }, dialogOptions).render(true);
            });
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
    * @param {String} template       The HTML template used to render the roll dialog
    * @param {String} title          The dice roll UI window title
    * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
    * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
    * @param {Boolean} critical      Allow critical hits to be chosen
    * @param {Function} onClose      Callback for actions to take when the dialog form is closed
    * @param {Object} dialogOptions  Modal dialog options
    */
    static damageRoll({ event = new Event(''), parts, criticalData, damageTypes, actor, data, template, title, speaker, flavor, critical = true, onClose, dialogOptions }) {
        flavor = flavor || title;

        const autoFastForward = game.settings.get('sfrpg', 'useQuickRollAsDefault');
        if (event && autoFastForward) {
            event.shiftKey = autoFastForward;
        }
        // Inner roll function
        let rollMode = game.settings.get("core", "rollMode");
        let roll = crit => {
            // Don't include situational bonus unless it is defined
            if (!data.bonus && parts.indexOf("@bonus") !== -1) parts.pop();

            //let roll = new Roll(parts.join("+"), data);
            const combinedFormula = DiceSFRPG.contextualRoll(parts.join("+"), {main: {entity: actor, data: data}}, {debug: false});
            let roll = new Roll(combinedFormula);
            if (crit === true) {
                let add = 0;
                let mult = 2;
                roll.alter(mult, add);
                flavor = `${title} (Critical)`;

                if (criticalData !== undefined) {
                    flavor = `${title} (Critical; ${criticalData.effect})`;

                    let critRoll = criticalData.parts.filter(x => x[0].length > 0).map(x => x[0]).join("+");
                    if (critRoll.length > 0) {
                        roll = new Roll(roll.formula + " + " + critRoll, data);
                    }
                }
            }

            // evaluate the roll so we can add some metadata to it
            roll.evaluate();
            
            // Associate the damage types for this attack to the first DiceTerm
            // for the roll. 
            const die = roll.dice && roll.dice.length > 0 ? roll.dice[0] : null;
            if (die) {
                die.options.isDamageRoll = true;
                die.options.damageTypes = damageTypes;
                die.options.isModal = data.item.properties.modal || data.item.properties.double;
            }

            // Execute the roll and send it to chat
            roll.toMessage({
                speaker: speaker,
                flavor: flavor,
                rollMode: rollMode
            });

            // Return the Roll object
            return roll;
        };

        // Modify the roll and handle fast-forwarding
        if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
            if (event.altKey) {
                this._updateModifiersForCrit(data, parts.join('+'), 2);
                parts = this._updateScalarModifiersForCrit(parts.join('+'), 2);
            }
            
            return Promise.resolve(roll(event.altKey));
        } else parts = parts.concat(["@bonus"]);

        // Construct dialog data
        template = template || "systems/sfrpg/templates/chat/roll-dialog.html";
        let dialogData = {
            formula: parts.join(" + "),
            data: data,
            rollMode: rollMode,
            rollModes: CONFIG.Dice.rollModes
        };

        // Render modal dialog
        let crit = false;
        return new Promise(resolve => {
            renderTemplate(template, dialogData).then(dlg => {
                new Dialog({
                    title: title,
                    content: dlg,
                    buttons: {
                        critical: {
                            condition: critical,
                            label: "Critical Hit",
                            callback: () => {
                                crit = true;
                                this._updateModifiersForCrit(data, parts.join('+'), 2);
                                parts = this._updateScalarModifiersForCrit(parts.join('+'), 2);
                            }
                        },
                        normal: {
                            label: critical ? "Normal" : "Roll",
                        },
                    },
                    default: "normal",
                    close: html => {
                        if (onClose) onClose(html, parts, data);
                        rollMode = html.find('[name="rollMode"]').val();
                        data['bonus'] = html.find('[name="bonus"]').val();
                        let r = roll(crit);
                        resolve(r);
                    }
                }, dialogOptions).render(true);
            });
        });
    }

    /**
     * Take a roll formula and multiply any modifiers by a given multiplier
     * 
     * @param {object} data The data model to extract from
     * @param {String} formula The formula sent to the Roll class
     * @param {Number} multiplier The number to multiply the modifier by
     */
    static _updateModifiersForCrit(data, formula, multiplier) {
        let matches = formula.match(new RegExp(/@[a-zA-Z.0-9]+/gi))?.map(x => x.replace('@', '')) ?? [];

        for (let match of matches) {
            let value = getProperty(data, match);
            if (!value) continue;
            value *= multiplier;
            setProperty(data, match, value);
        }
    }

    static _updateScalarModifiersForCrit(formula, multiplier) {
        const parts = formula.split('+');
        for (let i = 0; i < parts.length; i++) {
            if (Number.isNumeric(parts[i])) {
                parts[i] *= multiplier;
            }
        }

        return parts.map(x => x.toString());
    }

    static Defaults = {
        "details.level": "details.level.value",
        "skills.pil": "skills.pil.mod"
    };

    static _readValue(object, key) {
        if (!object || !key) return null;

        const tokens = key.split('.');
        for (const token of tokens) {
            object = object[token];
            if (!object) return null;
        }

        return object;
    }

    static contextualRoll(formula, contexts, options = {}) {

        try {
            const tree = new RollTree();
            const treeRoll = tree.buildRoll(formula, {allContexts: contexts, mainContext: "main"});
            console.log(treeRoll);
        } catch (error) {
            console.log(error);
            console.trace();
        }

        if (options.debug) {
            console.log(["contextualRoll", formula, contexts, options]);
        }

        const mainContext = options.mainContext ? contexts[options.mainContext] : (contexts ? Object.values(contexts)[0] : null);

        const replacements = {};
        
        let processedFormula = formula;
        const variableMatches = new Set(processedFormula.match(/@([a-zA-Z.0-9_\-]+)/g));
        for (const variable of variableMatches) {
            const variableParts = variable?.substring(1)?.split('.');
            if (!variableParts || variableParts.length === 0) {
                continue;
            }

            const bTargetsContext = (contexts && contexts[variableParts[0]] !== undefined) ? true : false;
            const targetContext = bTargetsContext ? contexts[variableParts[0]] : mainContext;
            const decontextedVariable = bTargetsContext ? variableParts.slice(1).join('.') : variableParts.join('.');
            const processedVariable = (decontextedVariable in DiceSFRPG.Defaults) ? DiceSFRPG.Defaults[decontextedVariable] : decontextedVariable;
            const rolledModsKey = processedVariable.substring(0, processedVariable.lastIndexOf('.')) + ".rolledMods";

            if (targetContext) {
                const rawValue = DiceSFRPG._readValue(targetContext.data, processedVariable);
                const availableMods = DiceSFRPG._readValue(targetContext.data, rolledModsKey);
                
                replacements[variable] = {base: rawValue, availableMods: availableMods || [], context: targetContext};
            } else {
                replacements[variable] = {base: 0, availableMods: [], context: null};

                if (options.debug) {
                    console.log(`No context available for '${processedVariable}'. Replacing '${variable}' with '0'`);
                }
            }
        }

        let availableModifiers = {};
        for (var [key, replacement] of Object.entries(replacements)) {
            for (let mod of replacement.availableMods) {
                availableModifiers[mod.bonus._id] = mod.bonus;
            }
        }

        for (var [key, replacement] of Object.entries(replacements)) {
            let result = replacement.base.toString();
            for (let mod of replacement.availableMods) {
                if (mod.bonus.enabled) {
                    let modRoll = DiceSFRPG.contextualRoll(mod.bonus.modifier, {main: replacement.context}, {debug: options.debug});
                    result += " + " + modRoll;
                }
            }
            processedFormula = processedFormula.replace(key, result);
        }

        if (options.debug) {
            console.log(["final result", formula, processedFormula]);
        }
        return processedFormula;
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
    constructor() {
        this.rootNode = null;
        this.nodes = {};
    }

    buildRoll(formula, contexts) {
        console.log(`Resolving '${formula}'`);
        this.rootNode = new RollNode(this, formula, null, false, false, true);
        this.nodes = {};

        this.nodes[formula] = this.rootNode;
        this.rootNode.populate(this.nodes, contexts);
        
        const allRolledMods = RollTree.getAllRolledModifiers(this.nodes);
        this.displayUI(formula, contexts, allRolledMods);
        
        const finalRollFormula = this.rootNode.resolve();
        console.log([`Final roll results outcome`, formula, finalRollFormula]);
        return finalRollFormula;
    }

    displayUI(formula, contexts, allRolledMods) {

    }

    static getAllRolledModifiers(nodes) {
        console.log(nodes);
        return Object.values(nodes).filter(x => x.isRolled);
    }
}

class RollNode {
    constructor(tree, formula, baseValue, isRolled, isVariable, isEnabled) {
        this.tree = tree;
        this.formula = formula;
        this.baseValue = baseValue;
        this.isRolled = isRolled;
        this.isVariable = isVariable;
        this.isEnabled = isEnabled;
        this.resolvedValue = undefined;
        this.childNodes = {};
    }
        
    populate(nodes, contexts) {
        if (this.isVariable) {
            const context = RollNode.getContextForVariable(this.formula, contexts);
            const availableRolledMods = RollNode.getRolledModifiers(this.formula, context);

            for (const mod of availableRolledMods) {
                const modFormula = mod.mod;

                let existingNode = nodes[modFormula];
                if (!existingNode) {
                    const childNode = new RollNode(this.tree, modFormula, null, false, false, mod.bonus.enabled);
                    nodes[modFormula] = childNode;
                    existingNode = childNode;
                }
                this.childNodes[modFormula] = existingNode;
            }
        }
        else {
            const variableMatches = new Set(this.formula.match(/@([a-zA-Z.0-9_\-]+)/g));
            for (const fullVariable of variableMatches) {
                const variable = fullVariable.substring(1);
                const context = RollNode.getContextForVariable(variable, contexts);
                const variableValue = RollNode._readValue(context.data, variable);

                let existingNode = nodes[variable];
                if (!existingNode) {
                    const childNode = new RollNode(this.tree, variable, variableValue, false, true, true);
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
            console.log(['Resolving', depth, this]);
            this.resolvedValue = {
                finalRoll: "",
                formula: ""
            };

            const enabledChildNodes = Object.values(this.childNodes).filter(x => x.isEnabled);

            if (this.baseValue) {
                this.resolvedValue.finalRoll = this.baseValue;
                this.resolvedValue.formula = this.formula;

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
                    this.resolvedValue.formula += childResolution.formula;
                }
            } else {
                // TODO: Implement formula, for example "3d6 + @abilities.str.mod + 2" should correctly replace the child node
                let valueString = this.formula;
                let formulaString = this.formula;
                const variableMatches = new Set(formulaString.match(/@([a-zA-Z.0-9_\-]+)/g));
                for (const fullVariable of variableMatches) {
                    const regexp = new RegExp(fullVariable, "gi");
                    const variable = fullVariable.substring(1);
                    const existingNode = this.childNodes[variable];
                    console.log(["testing var", depth, this, fullVariable, variable, existingNode]);
                    if (existingNode) {
                        const childResolution = existingNode.resolve(depth + 1);
                        valueString = valueString.replace(regexp, childResolution.finalRoll);
                        formulaString = formulaString.replace(regexp, childResolution.formula);
                        console.log(['Result', depth, childResolution, valueString, formulaString]);
                    } else {
                        console.log(['Result', depth, "0"]);
                        valueString = valueString.replace(regexp, "0");
                        formulaString = formulaString.replace(regexp, "0");
                    }
                }

                this.resolvedValue.finalRoll = valueString;
                this.resolvedValue.formula = formulaString;
            }
            console.log(["Resolved", depth, this, this.resolvedValue]);
            return this.resolvedValue;
        }
    }
            
    static getContextForVariable(variable, contexts) {
        const firstToken = variable.split('.')[0];
        const context = contexts.allContexts[firstToken] || (contexts.mainContext ? contexts.allContexts[contexts.mainContext] : null);
        //console.log(["getContextForVariable", variable, contexts, context]);
        return context;
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