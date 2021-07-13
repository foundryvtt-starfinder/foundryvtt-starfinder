import SFRPGCustomChatMessage from "./chat/chatbox.js";
import { SFRPG } from "./config.js";

export class DiceSFRPG {
    /**
    * A standardized helper function for managing core Starfinder "d20 rolls"
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
    *
    * @param {Event} event               The triggering event which initiated the roll
    * @param {Array} parts               The dice roll component parts, excluding the initial d20
    * @param {RollContext} rollContext   The contextual data for this roll
    * @param {String} title              The dice roll UI window title
    * @param {Object} speaker            The ChatMessage speaker to pass when creating the chat
    * @param {Function} flavor           A callable function for determining the chat message flavor given parts and data
    * @param {Boolean} advantage         Allow rolling with advantage (and therefore also with disadvantage)
    * @param {Number} critical           The value of d20 result which represents a critical success
    * @param {Number} fumble             The value of d20 result which represents a critical failure
    * @param {Function} onClose          Callback for actions to take when the dialog form is closed
    * @param {Object} dialogOptions      Modal dialog options
    */
    static async d20Roll({ event = new Event(''), parts, rollContext, title, speaker, flavor, advantage = true,
        critical = 20, fumble = 1, onClose, dialogOptions }) {
        
        if (!rollContext?.isValid()) {
            console.log(['Invalid rollContext', rollContext]);
            return null;
        }

        /** New roll formula system */
        const buttons = {};
        if (game.settings.get("sfrpg", "useAdvantageDisadvantage") && advantage) {
            buttons["Disadvantage"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Disadvantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.DisadvantageTooltip") };
            buttons["Normal"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Normal"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalTooltip") };
            buttons["Advantage"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Advantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.AdvantageTooltip") };
        } else {
            buttons["Normal"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Roll") };
        }

        const options = {
            debug: false,
            buttons: buttons,
            defaultButton: "Normal",
            title: title,
            skipUI: (event?.shiftKey || game.settings.get('sfrpg', 'useQuickRollAsDefault') || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            mainDie: "1d20",
            dialogOptions: dialogOptions
        };

        const formula = parts.map(x => x instanceof Object ? `${x.score}[${x.explanation}]` : x).join(" + ");

        const tree = new RollTree(options);
        return tree.buildRoll(formula, rollContext, async (button, rollMode, finalFormula) => {
            if (button === "cancel") {
                if (onClose) {
                    onClose(null, null, null);
                }
                return null;
            }

            let dieRoll = "1d20";
            if (button === "Disadvantage") {
                dieRoll = "2d20kl";
            } else if (button === "Advantage") {
                dieRoll = "2d20kh";
            }

            finalFormula.finalRoll = dieRoll + " + " + finalFormula.finalRoll;
            finalFormula.formula = dieRoll + " + " + finalFormula.formula;
            finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ").trim();
            finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;
            const preparedRollExplanation = DiceSFRPG.formatFormula(finalFormula.formula);

            const rollObject = new Roll(finalFormula.finalRoll);
            let roll = await rollObject.evaluate({async: true});

            // Flag critical thresholds
            for (let d of roll.dice) {
                if (d.faces === 20) {
                    d.options.critical = critical;
                    d.options.fumble = fumble;
                }
            }

            if (flavor) {
                const chatData = {
                    type: CONST.CHAT_MESSAGE_TYPES.IC,
                    speaker: speaker,
                    content: flavor
                };
        
                ChatMessage.create(chatData, { chatBubble: true });
            }

            let useCustomCard = game.settings.get("sfrpg", "useCustomChatCards");
            let errorToThrow = null;
            if (useCustomCard) {
                //Push the roll to the ChatBox
                const customData = {
                    title: title,
                    rollContext:  rollContext,
                    speaker: speaker,
                    rollMode: rollMode
                };

                try {
                    useCustomCard = SFRPGCustomChatMessage.renderStandardRoll(roll, customData, preparedRollExplanation);
                } catch (error) {
                    useCustomCard = false;
                    errorToThrow = error;
                }
            }
            
            if (!useCustomCard) {
                roll.render().then((rollContent) => {
                    const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
                    const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);
            
                    ChatMessage.create({
                        flavor: title,
                        speaker: speaker,
                        content: explainedRollContent,
                        rollMode: rollMode,
                        roll: roll,
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        sound: CONFIG.sounds.dice
                    });
                });
            }

            if (onClose) {
                onClose(roll, formula, finalFormula);
            }

            if (errorToThrow) {
                throw errorToThrow;
            }
        });
    }

    /**
    * A standardized helper function for managing Starfinder rolls.
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively (Only available for d20 rolls)
    * 
    * Returns a promise that will return an object containing roll and formula.
    *
    * @param {Event} event               The triggering event which initiated the roll
    * @param {String} rollFormula        The roll formula to use, excluding the initial die. If left empty, will look for parts.
    * @param {Array} parts               The dice roll component parts, excluding the initial die
    * @param {RollContext} rollContext   The contextual data for this roll
    * @param {String} title              The dice roll UI window title
    * @param {String} mainDie            The main die to use for this roll, e.g. "d20".
    * @param {Boolean} advantage         Allow rolling with advantage (and therefore also with disadvantage)
    * @param {Number} critical           The value of d20 result which represents a critical success
    * @param {Number} fumble             The value of d20 result which represents a critical failure
    * @param {Object} dialogOptions      Modal dialog options
    */
    static async createRoll({ event = new Event(''), rollFormula = null, parts, rollContext, title, mainDie = "d20", advantage = true, critical = 20, fumble = 1, dialogOptions }) {
        
        if (!rollContext?.isValid()) {
            console.log(['Invalid rollContext', rollContext]);
            return null;
        }

        /** New roll formula system */
        const buttons = {};
        if (game.settings.get("sfrpg", "useAdvantageDisadvantage") && advantage) {
            buttons["Disadvantage"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Disadvantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.DisadvantageTooltip") };
            buttons["Normal"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Normal"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalTooltip") };
            buttons["Advantage"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Advantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.AdvantageTooltip") };
        } else {
            buttons["Normal"] = { label: game.i18n.format("SFRPG.Rolls.Dice.Roll") };
        }

        const options = {
            debug: false,
            buttons: buttons,
            defaultButton: "Normal",
            title: title,
            skipUI: (event?.shiftKey || game.settings.get('sfrpg', 'useQuickRollAsDefault') || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            mainDie: "1" + mainDie,
            dialogOptions: dialogOptions
        };

        const formula = rollFormula || parts.join(" + ");

        const tree = new RollTree(options);
        if (dialogOptions?.skipUI) {
            let result = null;
            await tree.buildRoll(formula, rollContext, async (button, rollMode, finalFormula) => {
                let dieRoll = "1" + mainDie;
                if (mainDie == "d20") {
                    if (button === "Disadvantage") {
                        dieRoll = "2d20kl";
                    } else if (button === "Advantage") {
                        dieRoll = "2d20kh";
                    }
                }

                finalFormula.finalRoll = dieRoll + " + " + finalFormula.finalRoll;
                finalFormula.formula = dieRoll + " + " + finalFormula.formula;

                const rollObject = new Roll(finalFormula.finalRoll);
                let roll = await rollObject.evaluate({async: true});
    
                // Flag critical thresholds
                for (let d of roll.dice) {
                    if (d.faces === 20) {
                        d.options.critical = critical;
                        d.options.fumble = fumble;
                    }
                }

                result = {roll: roll, formula: finalFormula};
            });
            return result;
        } else {
            return new Promise((resolve) => {
                tree.buildRoll(formula, rollContext, async (button, rollMode, finalFormula) => {
                    if (button === "cancel") {
                        resolve(null);
                        return;
                    }
    
                    const dieRoll = "1" + mainDie;
                    if (mainDie == "d20") {
                        if (button === "Disadvantage") {
                            dieRoll = "2d20kl";
                        } else if (button === "Advantage") {
                            dieRoll = "2d20kh";
                        }
                    }
    
                    finalFormula.finalRoll = dieRoll + " + " + finalFormula.finalRoll;
                    finalFormula.formula = dieRoll + " + " + finalFormula.formula;
                    finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ").trim();
                    finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;
    
                    const rollObject = new Roll(finalFormula.finalRoll);
                    const roll = await rollObject.evaluate({async: true});
            
                    // Flag critical thresholds
                    for (let d of roll.dice) {
                        if (d.faces === 20) {
                            d.options.critical = critical;
                            d.options.fumble = fumble;
                        }
                    }
    
                    resolve({roll: roll, formula: finalFormula});
                });
            });
        }
    }

    /* -------------------------------------------- */

    /**
    * A standardized helper function for managing core 5e "d20 rolls"
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
    *
    * @param {Event} event                The triggering event which initiated the roll
    * @param {Array} parts                The dice roll component parts, excluding the initial d20
    * @param {Object} criticalData        Critical damage information, in case of a critical hit
    * @param {Array} damageTypes          Array of damage types associated with this roll
    * @param {RollContext} rollContext    The contextual data for this roll
    * @param {String} title               The dice roll UI window title
    * @param {Object} speaker             The ChatMessage speaker to pass when creating the chat
    * @param {Function} flavor            A callable function for determining the chat message flavor given parts and data
    * @param {Boolean} critical           Allow critical hits to be chosen
    * @param {Function} onClose           Callback for actions to take when the dialog form is closed
    * @param {Object} dialogOptions       Modal dialog options
    */
    static async damageRoll({ event = new Event(''), parts, criticalData, damageTypes, rollContext, title, speaker, flavor, critical = true, onClose, dialogOptions }) {
        flavor = flavor || title;

        if (!rollContext?.isValid()) {
            console.log(['Invalid rollContext', rollContext]);
            return null;
        }

        /** New roll formula system */
        const buttons = {
            Normal: { label: game.i18n.format("SFRPG.Rolls.Dice.NormalDamage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalDamageTooltip") },
            Critical: { label: game.i18n.format("SFRPG.Rolls.Dice.CriticalDamage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.CriticalDamageTooltip") }
        };

        const options = {
            debug: false,
            buttons: buttons,
            defaultButton: "Normal",
            title: title,
            skipUI: (event?.shiftKey || game.settings.get('sfrpg', 'useQuickRollAsDefault') || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            mainDie: "",
            dialogOptions: dialogOptions
        };

        const formula = parts.join(" + ");
        const tree = new RollTree(options);
        return tree.buildRoll(formula, rollContext, async (button, rollMode, finalFormula) => {
            if (button === 'cancel') {
                if (onClose) {
                    onClose(null, null, null, false);
                }
                return null;
            }

            const isCritical = (button === "Critical");
            if (isCritical) {
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
            
            finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ").trim();
            finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;
            const preparedRollExplanation = DiceSFRPG.formatFormula(finalFormula.formula);

            const rollObject = new Roll(finalFormula.finalRoll);
            let roll = await rollObject.evaluate({async: true});
            
            // Associate the damage types for this attack to the first DiceTerm
            // for the roll. 
            const die = roll.dice && roll.dice.length > 0 ? roll.dice[0] : null;
            if (die) {
                die.options.isDamageRoll = true;
                die.options.damageTypes = damageTypes;

                const properties = rollContext.allContexts["item"]?.data?.properties;
                if (properties) {
                    die.options.isModal = properties.modal || properties.double;
                }
            }

            const tags = [];

            if (damageTypes) {
                for (const damageType of damageTypes) {
                    const tag = "damage-type-" + damageType.types.join(`-${damageType.operator}-`);
                    let text = "";
                    for (const type of damageType.types) {
                        text += SFRPG.damageTypes[type];
                        if (damageType.operator.trim() !== "")
                            text += ` ${SFRPG.damageTypeOperators[damageType.operator]} `;
                    }

                    if (damageType.operator.trim() !== "")
                        text = text.substring(0, text.lastIndexOf(SFRPG.damageTypeOperators[damageType.operator]) - 1);
                    
                    tags.push({ tag: tag, text: text });
                }
            }

            if (button === "Critical") {
                tags.push({tag: `critical`, text: "Critical Hit"});
            }

            const itemContext = rollContext.allContexts['item']; 
            if (itemContext) {
                /** Regular Weapons use data.properties for their properties */
                if (itemContext.entity.data.data.properties) {
                    try {
                        for (const [key, isEnabled] of Object.entries(itemContext.entity.data.data.properties)) {
                            if (isEnabled) {
                                tags.push({tag: `weapon-properties ${key}`, text: SFRPG.weaponProperties[key]});
                            }
                        }
                    } catch { }
                }

                /** Starship Weapons use data.special for their properties */
                if (itemContext.entity.data.type === "starshipWeapon") {
                    tags.push({tag: `starship-weapon-type ${itemContext.entity.data.data.weaponType}`, text: SFRPG.starshipWeaponTypes[itemContext.entity.data.data.weaponType]});

                    if (itemContext.entity.data.data.special) {
                        try {
                            for (const [key, isEnabled] of Object.entries(itemContext.entity.data.data.special)) {
                                if (isEnabled) {
                                    tags.push({tag: `starship-weapon-properties ${key}`, text: SFRPG.starshipWeaponProperties[key]});
                                }
                            }
                        } catch { }
                    }
                }
            }

            let tagContent = ``;
            if (tags.length > 0) {
                tagContent = `<div class="sfrpg chat-card"><footer class="card-footer">`;
                for (const tag of tags) {
                    tagContent += `<span class="${tag.tag}">${tag.text}</span>`;
                }
                tagContent += `</footer></div>`;
            }

            let useCustomCard = game.settings.get("sfrpg", "useCustomChatCards");
            let errorToThrow = null;
            if (useCustomCard) {
                //Push the roll to the ChatBox
                const customData = {
                    title: title,
                    rollContext:  rollContext,
                    speaker: speaker,
                    rollMode: rollMode
                };

                try {
                    useCustomCard = SFRPGCustomChatMessage.renderStandardRoll(roll, customData, preparedRollExplanation, tagContent);
                } catch (error) {
                    useCustomCard = false;
                    errorToThrow = error;
                }
            }
            
            if (!useCustomCard) {
                roll.render().then((rollContent) => {
                    const insertIndex = rollContent.indexOf(`<section class="tooltip-part">`);
                    const explainedRollContent = rollContent.substring(0, insertIndex) + preparedRollExplanation + rollContent.substring(insertIndex);
            
                    ChatMessage.create({
                        flavor: flavor,
                        speaker: speaker,
                        content: explainedRollContent + tagContent,
                        rollMode: rollMode,
                        roll: roll,
                        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                        sound: CONFIG.sounds.dice
                    });
                });
            }

            if (onClose) {
                onClose(roll, formula, finalFormula, isCritical);
            }

            if (errorToThrow) {
                throw errorToThrow;
            }
        });
    }

    /**
     * Hightlight rolls that are considered critical successes or failures.
     * 
     * @param {ChatMessage} message            The ChatMessage document being rendered
     * @param {JQuery}      html               The pending HTML as a jQuery object
     * @param {Object}      data               The input data provided for template rendering
     * @param {Object}      data.data          The ChatMessage data
     * @param {User}        data.user          The User that initiated the ChatMessage
     * @param {User}        data.author        The name of the Actor that created this ChatMessage
     * @param {string}      data.alias         The alias of the Actor that created this ChatMessage
     * @param {string[]}    data.cssClass      CSS classes that should be applied to this message
     * @param {boolean}     data.isWhisper     Should this ChatMessage be sent in a private message
     * @param {string[]}    data.whisperTo     A list of user names this message should be sent to
     * @param {string}      [data.borderColor] A border color applied to the chat card
     */
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
     * @param {ChatMessage} message            The ChatMessage document being rendered
     * @param {JQuery}      html               The pending HTML as a jQuery object
     * @param {Object}      data               The input data provided for template rendering
     * @param {Object}      data.data          The ChatMessage data
     * @param {User}        data.user          The User that initiated the ChatMessage
     * @param {User}        data.author        The name of the Actor that created this ChatMessage
     * @param {string}      data.alias         The alias of the Actor that created this ChatMessage
     * @param {string[]}    data.cssClass      CSS classes that should be applied to this message
     * @param {boolean}     data.isWhisper     Should this ChatMessage be sent in a private message
     * @param {string[]}    data.whisperTo     A list of user names this message should be sent to
     * @param {string}      [data.borderColor] A border color applied to the chat card
     */
    static addDamageTypes(message, html, data) {
        if (!message.isRoll || !message.isContentVisible) return;

        const roll = message.roll;
        if (!roll?.dice.length > 0) return;
        const die = roll.dice[0];

        if (die?.options?.isDamageRoll) {
            const types = die?.options?.damageTypes;

            html.data("damageTypes", types);
        }
    }

    static formatFormula(formulaText) {
        let index = 0;
        let consumedText = "";
        let isReading = false;
        const sections = [];
        while (index < formulaText.length) {
            const token = formulaText[index++];
            if (token === "[") {
                sections.push({text: consumedText, replace: true});
                consumedText = "";
                isReading = true;
            } else if (token === "]" && isReading) {
                sections.push({text: consumedText, replace: false});
                consumedText = "";
                isReading = false;
            }
            consumedText += token;
        }
        if (consumedText) {
            sections.push({text: consumedText, replace: true});
        }

        let finalResult = "";
        for (const section of sections) {
            if (section.replace) {
                finalResult += section.text.replace(/\+/gi, "<br/> +").replace(/-/gi, "<br/> -");
            } else {
                finalResult += section.text;
            }
        }
        return finalResult;
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

        /** Verify variable contexts, replace bad ones with 0. */
        const variableMatches = new Set(this.formula.match(/@([a-zA-Z.0-9_\-]+)/g));
        for (const variable of variableMatches) {
            const [context, remainingVariable] = RollNode.getContextForVariable(variable, contexts);
            if (!context) {
                console.log(`Cannot find context for variable '${variable}', substituting with a 0.`);
                const regexp = new RegExp(variable, "gi");
                this.formula = this.formula.replace(regexp, "0");
            }
        }

        const allRolledMods = this.populate();

        if (this.options.skipUI) {
            const button = this.options.defaultButton || (this.options.buttons ? Object.values(this.options.buttons)[0].label : "Roll");
            const rollMode = game.settings.get("core", "rollMode");

            for (const [key, value] of Object.entries(this.nodes)) {
                if (value.referenceModifier) {
                    value.isEnabled = value.referenceModifier.enabled;
                }
            }

            const finalRollFormula = this.rootNode.resolve();

            if (this.options.debug) {
                console.log([`Final roll results outcome`, formula, allRolledMods, finalRollFormula]);
            }

            if (callback) {
                await callback(button, rollMode, finalRollFormula);
            }
            return {button: button, rollMode: rollMode, finalRollFormula: finalRollFormula};
        }

        const uiPromise = this.displayUI(formula, contexts, allRolledMods);
        uiPromise.then(async ([button, rollMode, bonus]) => {
            if (button === null) {
                console.log('Roll was cancelled');
                await callback('cancel', "none", null);
                return;
            }

            for (const [key, value] of Object.entries(this.nodes)) {
                if (value.referenceModifier) {
                    value.isEnabled = value.referenceModifier.enabled;
                }
            }

            const finalRollFormula = this.rootNode.resolve();
            bonus = bonus.trim();
            if (bonus) {
                const operators = ['+', '-', '*', '/'];
                if (!operators.includes(bonus[0])) {
                    finalRollFormula.finalRoll += " +";
                    finalRollFormula.formula += " +";
                }
                finalRollFormula.finalRoll += " " + bonus;
                finalRollFormula.formula += ` ${bonus} [Additional Bonus]`;
            }

            if (this.options.debug) {
                console.log([`Final roll results outcome`, formula, allRolledMods, finalRollFormula]);
            }

            await callback(button, rollMode, finalRollFormula);
        });
        return uiPromise;
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
        const availableModifiers = [].concat(allRolledMods.map(x => x.referenceModifier));
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
    constructor(tree, formula, baseValue, referenceModifier, isVariable, isEnabled, parentNode = null) {
        this.tree = tree;
        this.formula = formula;
        this.baseValue = baseValue;
        this.referenceModifier = referenceModifier;
        this.isVariable = isVariable;
        this.isEnabled = isEnabled;
        this.resolvedValue = undefined;
        this.childNodes = {};
        this.parentNode = parentNode;
        this.nodeContext = null;
        this.variableTooltips = null;
    }
        
    populate(nodes, contexts) {
        if (this.isVariable) {
            const [context, remainingVariable] = RollNode.getContextForVariable(this.formula, contexts);
            this.nodeContext = context;

            const availableRolledMods = RollNode.getRolledModifiers(remainingVariable, this.getContext());
            this.variableTooltips = RollNode.getTooltips(remainingVariable, this.getContext());

            for (const mod of availableRolledMods) {
                const modKey = mod.bonus.name;

                let existingNode = nodes[modKey];
                if (!existingNode) {
                    const childNode = new RollNode(this.tree, mod.bonus.modifier, null, mod.bonus, false, mod.bonus.enabled, this);
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
                this.nodeContext = context;

                let variableValue = 0;
                try {
                    variableValue = RollNode._readValue(this.getContext().data, remainingVariable);
                } catch (error) {
                    console.log(["error reading value", remainingVariable, this, error]);
                }

                let existingNode = nodes[variable];
                if (!existingNode) {
                    const childNode = new RollNode(this.tree, variable, variableValue, null, true, true, this);
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

    getContext() {
        if (this.nodeContext) return this.nodeContext;
        let parent = this.parentNode;
        while (parent && !this.nodeContext) {
            this.nodeContext = parent.nodeContext;
            parent = parent.parentNode;
        }
        return this.nodeContext;
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

            if (this.isVariable && !this.baseValue) {
                this.baseValue = "0";
            }

            if (this.baseValue) {
                if (this.baseValue !== "n/a") {
                    const joinedTooltips = this.variableTooltips.join(',\n');

                    this.resolvedValue.finalRoll = this.baseValue;
                    this.resolvedValue.formula = this.baseValue + "[";
                    this.resolvedValue.formula += "<span";
                    if (joinedTooltips) {
                        this.resolvedValue.formula += ` title="${joinedTooltips}"`;
                    }
                    this.resolvedValue.formula += `>`;
                    this.resolvedValue.formula += (this.referenceModifier?.name || "@" + this.formula);
                    this.resolvedValue.formula += `</span>`;
                    this.resolvedValue.formula += "]";
                }

                // formula
                const enabledChildNodes = Object.values(this.childNodes).filter(x => x.isEnabled);
                for (const childNode of enabledChildNodes) {
                    const childResolution = childNode.resolve(depth + 1);
                    if (this.resolvedValue.finalRoll !== "") {
                        this.resolvedValue.finalRoll += " + ";
                    }
                    this.resolvedValue.finalRoll += childResolution.finalRoll;

                    if (this.resolvedValue.formula !== "") {
                        this.resolvedValue.formula += " + ";
                    }

                    if (childResolution.formula.endsWith("]")) {
                        this.resolvedValue.formula += childResolution.formula;
                    } else {
                        this.resolvedValue.formula += childResolution.formula + `[${childNode.referenceModifier.name}]`;
                    }
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

                valueString = valueString.trim();
                if (valueString.endsWith("+")) {
                    valueString = valueString.substring(0, valueString.length - 1).trim();
                }

                /** Remove any naming from the valueString. */
                let limit = 5;
                while (valueString.includes("[") && valueString.includes("]") && limit > 0) {
                    const openIndex = valueString.indexOf("[");
                    const closeIndex = valueString.indexOf("]");
                    if (closeIndex > openIndex) {
                        valueString = valueString.substring(0, openIndex) + valueString.substring(closeIndex + 1);
                    }
                    limit--;
                }

                formulaString = formulaString.trim();
                if (formulaString.endsWith("+")) {
                    formulaString = formulaString.substring(0, formulaString.length - 1).trim();
                }

                this.resolvedValue.finalRoll = valueString;
                this.resolvedValue.formula = formulaString;
            }
            //console.log(["Resolved", depth, this, this.resolvedValue]);
            return this.resolvedValue;
        }
    }
            
    static getContextForVariable(variable, contexts) {
        if (variable[0] === '@') {
            variable = variable.substring(1);
        }

        const firstToken = variable.split('.')[0];

        if (contexts.allContexts[firstToken]) {
            //console.log(["getContextForVariable", variable, contexts, contexts.allContexts[firstToken]]);
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
        
    static getTooltips(variable, context) {
        let variableString = variable + ".tooltip";
        let variableRolledMods = RollNode._readValue(context.data, variableString);
        if (!variableRolledMods) {
            variableString = variable.substring(0, variable.lastIndexOf('.')) + ".tooltip";
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

        // tooltips
        this._tooltips = null;
    }

    get template() {
        return "systems/sfrpg/templates/chat/roll-dialog.html";
    }

    async _render(...args) {
        await super._render(...args);

        if (this._tooltips === null) {
            this._tooltips = tippy.delegate(`#${this.id}`, {
                target: '[data-tippy-content]',
                allowHTML: true,
                arrow: false,
                placement: 'top-start',
                duration: [500, null],
                delay: [800, null]
            });
        }        
    }

    getData() {
        let data = super.getData();
        data.formula = this.formula;
        data.rollMode = this.rollMode;
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
        const modifierIndex = $(event.currentTarget).data('modifierIndex');
        const modifier = this.availableModifiers[modifierIndex];

        modifier.enabled = !modifier.enabled;
        this.render(false);

        if (modifier._id) {
            // Update container
            const container = modifier.container;
            const actor = await game.actors.get(container.actorId);
            if (container.itemId) {
                const item = container.itemId ? await actor.items.get(container.itemId) : null;

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
    }

    async _onSelectorChanged(event) {
        const selectorName = event.target.name;
        const selectedValue = event.target.value;

        this.selectors[selectorName].value = selectedValue;
        this.contexts.allContexts[selectorName] = this.contexts.allContexts[selectedValue];
        
        /** Repopulate nodes, might change modifiers because of different selector. */
        this.availableModifiers = this.rollTree.populate();
        
        this.position.height = "auto";
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
        if (this.data.close) {
            this.data.close(this.rolledButton, this.rollMode, this.additionalBonus);
            delete this.data.close;
        }

        if (this._tooltips !== null) {
            for (const tooltip of this._tooltips) {
                tooltip.destroy();
            }

            this._tooltips = null;
        }

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

export class RollContext {
    constructor() {
        this.allContexts = {};
        this.mainContext = null;
        this.selectors = [];
    }

    addContext(name, entity, data = null) {
        this.allContexts[name] = {entity: entity, data: data || entity.data.data};
    }

    addSelector(target, options) {
        this.selectors.push({target: target, options: options});
    }

    setMainContext(mainContext) {
        this.mainContext = mainContext;
    }

    isValid() {
        /** Check if all contexts are valid. */
        for (const [key, context] of Object.entries(this.allContexts)) {
            if (!context.entity || !context.data) {
                console.log([`Context for entity ${key}:${context.entity?.name} is invalid (${context.data}).`, context, this.allContexts]);
                return false;
            }
        }

        /** Check if the main context is valid. */
        if (this.mainContext && !this.allContexts[this.mainContext]) {
            console.log([`Main context is invalid.`, this.mainContext]);
            return false;
        }

        /** Check if selector options are valid. */
        for (const selector of this.selectors) {
            for (const option of selector.options) {
                if (!this.allContexts[option]) {
                    console.log([`Selector ${selector.name} has an invalid option ${option}.`, selector, option]);
                    return false;
                }
            }
        }
        return true;
    }

    getValue(variable) {
        if (!variable) return null;

        const [context, key] = this.getContextForVariable(variable);

        let result = RollContext._readValue(context.data, key);
        if (!result) {
            result = RollContext._readValue(context.entity.data, key);
        }

        return result;
    }
            
    getContextForVariable(variable) {
        if (variable[0] === '@') {
            variable = variable.substring(1);
        }

        const firstToken = variable.split('.')[0];

        if (this.allContexts[firstToken]) {
            //console.log(["getContextForVariable", variable, contexts, contexts.allContexts[firstToken]]);
            return [this.allContexts[firstToken], variable.substring(firstToken.length + 1)];
        }

        const context = (this.mainContext ? this.allContexts[this.mainContext] : null);
        //console.log(["getContextForVariable", variable, contexts, context]);
        return [context, variable];
    }

    hasMultipleSelectors() {
        for (const [key, value] of Object.entries(this.selectors)) {
            if (value.options?.length > 1) {
                return true;
            }
        }
        return false;
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