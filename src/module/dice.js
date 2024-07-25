import SFRPGCustomChatMessage from "./chat/chatbox.js";
import { SFRPG } from "./config.js";
import RollContext from "./rolls/rollcontext.js";
import RollTree from "./rolls/rolltree.js";
import StackModifiers from "./rules/closures/stack-modifiers.js";

// Type definitions for documentation.
/**
 * A data structure for storing data about damage types
 *
 * @typedef {Object} DamageType
 * @property {String[]} types    An array of damage types.
 * @property {string}   operator An operator that determines how damage is split between multiple types.
 */

/**
 * A data structure for storing damage statistics.
 *
 * @typedef {Object} DamagePart
 * @property {string}                     formula  The roll formula to use.
 * @property {{[key: string]: boolean}}   types    A set of key value pairs that determines the available damage types.
 * @property {string}                     operator An operator that determines how damage is split between multiple types.
 */

/**
 * A data structure to define critical damage.
 *
 * @typedef {Object} CriticalDamage
 * @property {string}       effect The critical damage effect.
 * @property {DamagePart[]} parts  Any damage rolls used with this critical
 */

/**
 * The data for a foundry Speaker
 *
 * @typedef {Object} SpeakerData
 * @property {string} scene The internal ID for the associated scene.
 * @property {string} actor The internal ID for the associated actor.
 * @property {string} token The internal ID for the associated token.
 * @property {string} alias The name of the speaker.
 */

/**
 * Options that can be passed into a foundry Dialog.
 *
 * @typedef {Object} DialogOptions
 * @property {boolean}  [jQuery]          Whether to provide jQuery objects to callback functions (if true)
 *                                        or play HTMLElement instances (if false). This is currently true by
 *                                        default but in the future will become false by default.
 * @property {string}   [baseApplication] A named "base application" which generates an additional hook
 * @property {number}   [width]           The default pixel width for the rendered HTML
 * @property {number}   [height]          The default pixel height for the rendered HTML
 * @property {number}   [top]             The default offset-top position for the rendered HTML
 * @property {number}   [left]            The default offset-left position for the rendered HTML
 * @property {number}   [scale]           A transformation scale for the rendered HTML
 * @property {boolean}  [popOut]          Whether to display the application as a pop-out container
 * @property {boolean}  [minimizable]     Whether the rendered application can be minimized (popOut only)
 * @property {boolean}  [resizable]       Whether the rendered application can be drag-resized (popOut only)
 * @property {string}   [id]              The default CSS id to assign to the rendered HTML
 * @property {string[]} [classes]         An array of CSS string classes to apply to the rendered HTML
 * @property {string}   [title]           A default window title string (popOut only)
 * @property {string}   [template]        The default HTML template path to render for this Application
 * @property {string[]} [scrollY]         A list of unique CSS selectors which target containers that should
 *                                        have their vertical scroll positions preserved during a re-render.
 * @property {TabsConfiguration[]} [tabs] An array of tabbed container configurations which should be enabled
 *                                        for the application.
 * @property {boolean}  [skipUI]          Should this dialog be skipped?
 */

/**
 * Temporary data structure used to hold the final formula and explanation for a Roll.
 *
 * @typedef {Object} FinalFormula
 * @property {string} finalRoll The finalized forumla used in the Roll
 * @property {string} formula   The summarized explanation of the roll formula
 */

/**
 * The results of a Roll
 *
 * @typedef {Object} RollResult
 * @property {Roll}         roll    The data for the roll
 * @property {FinalFormula} formula The finalized formula used in the roll
 */

/**
 * A data structure for outputing any metadata that is rendered at the bottom
 * of a Roll chat card.
 *
 * @typedef {Object} Tag
 * @property {string} tag Text that will be addeded as a class on an HTMLElement
 * @property {string} text The text rendered on the card.
 */

/**
 * A structure for passing data into an HTML for for use in data- attributes.
 *
 * @typedef {Object} HtmlData
 * @property {string} name The name of the data property sans data-
 * @property {string} value The value of the data property.
 */

/**
 * An optional modifer that can be added to a roll.
 *
 * @typedef {Object} Modifier
 * @property {string}  name     The name of the modifer.
 * @property {boolean} enabled  Whether this modifier is enabled or not.
 * @property {string}  modifier The modifier being added.
 * @property {string}  notes    Any additional text about the modifier.
 */

/**
 * Function called when the attack roll dialog is closed.
 *
 * @callback onD20DialogClosed
 * @param {Roll}         roll         The data for the roll.
 * @param {string}       formula      The formula used in the roll.
 * @param {FinalFormula} finalFormula The final computed roll formula.
 * @returns {void}
 */

/**
 * Function called when the damage roll dialog is closed.
 *
 * @callback onDamageDialogClosed
 * @param {Roll}         roll         The data for the roll.
 * @param {string}       formula      The formula used in the roll.
 * @param {FinalFormula} finalFormula The final computed roll formula.
 * @param {boolean}      isCritical   Was this a critial damage roll.
 */

/**
 * Called when a roll is built.
 *
 * @async
 * @callback onRollBuilt
 * @param {string}       button           The name of the button clicked.
 * @param {string}       rollMode         The roll mode passed into the Roll.
 * @param {FinalFormula} finalRollFormula The final roll formula.
 * @returns {Promise<void>}
 */

export class DiceSFRPG {
    /**
    * A standardized helper function for managing core Starfinder "d20 rolls"
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
    *
    * @param {Object}               data               The parameters passed into the method
    * @param {Event|JQuery.Event}   [data.event]       The triggering event which initiated the roll
    * @param {string[]}             data.parts         The dice roll component parts, excluding the initial d20
    * @param {RollContext}          data.rollContext   The contextual data for this roll
    * @param {String}               data.title         The dice roll UI window title
    * @param {SpeakerData}          data.speaker       The ChatMessage speaker to pass when creating the chat
    * @param {string}               data.flavor        Any flavor text associated with this roll
    * @param {Boolean}              [data.advantage]   Allow rolling with advantage (and therefore also with disadvantage)
    * @param {Object}               data.rollOptions   Additional options to be stored with the roll
    * @param {Number}               [data.critical]    The value of d20 result which represents a critical success
    * @param {Number}               [data.fumble]      The value of d20 result which represents a critical failure
    * @param {onD20DialogClosed}    data.onClose       Callback for actions to take when the dialog form is closed
    * @param {DialogOptions}        data.dialogOptions Modal dialog options
    */
    static async d20Roll({ event = new Event(''), parts, rollContext, title, speaker, flavor, advantage = true, rollOptions = {},
        critical = 20, fumble = 1, chatMessage = true, onClose, dialogOptions, actorContextKey = "actor" }) {

        flavor = `${title}${(flavor ? " <br> " + flavor : "")}`;

        if (!rollContext?.isValid()) {
            console.log(['Invalid rollContext', rollContext]);
            return null;
        }

        /** New roll formula system */
        const buttons = {};
        if (game.settings.get("sfrpg", "useAdvantageDisadvantage") && advantage) {
            buttons["Disadvantage"] = { id: "disadvantage", label: game.i18n.format("SFRPG.Rolls.Dice.Disadvantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.DisadvantageTooltip") };
            buttons["Normal"] = { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.Normal"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalTooltip") };
            buttons["Advantage"] = { id: "advantage", label: game.i18n.format("SFRPG.Rolls.Dice.Advantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.AdvantageTooltip") };
        } else {
            buttons["Normal"] = { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.Roll") };
        }

        const options = {
            debug: false,
            buttons: buttons,
            defaultButton: "normal",
            title: title,
            skipUI: ((game.settings.get('sfrpg', 'useQuickRollAsDefault')) ? !event?.shiftKey : event?.shiftKey || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            mainDie: "1d20",
            dialogOptions: dialogOptions,
            useRawStrings: false
        };

        const partMapper = (part) => {
            if (part instanceof Object) {
                if (part.explanation) {
                    if (part.score) {
                        return `${part.score}[${part.explanation}]`;
                    }
                    return `0[${part.explanation}]`;
                } else {
                    if (part.score) {
                        return `${part.score}`;
                    }
                    return `0`;
                }
            }
            return part;
        };
        const formula = parts.map(partMapper).join(" + ");

        const tree = new RollTree(options);
        return await tree.buildRoll(formula, rollContext, async (button, rollMode, unusedFinalFormula, node, rollMods, bonus = null) => {
            if (button === "cancel") {
                if (onClose) {
                    onClose(null, null, null);
                }
                return null;
            }

            let dieRoll = "1d20";
            if (button === "disadvantage") {
                dieRoll = "2d20kl";
            } else if (button === "advantage") {
                dieRoll = "2d20kh";
            }

            const finalFormula = await this._calcStackingFormula(node, rollMods, bonus, rollContext.allContexts[actorContextKey]?.entity);

            finalFormula.finalRoll = `${dieRoll} + ${finalFormula.finalRoll}`;
            finalFormula.formula = `${dieRoll} + ${finalFormula.formula}`;
            finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ")
                .trim();
            finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;
            const preparedRollExplanation = DiceSFRPG.formatFormula(finalFormula.formula);

            const tags = [];
            if (rollOptions?.actionTarget) {
                tags.push({ name: "actionTarget", text: game.i18n.format("SFRPG.Items.Action.ActionTarget.Tag", {actionTarget: rollOptions.actionTargetSource[rollOptions.actionTarget]}) });
            }

            const rollObject = Roll.create(finalFormula.finalRoll, { breakdown: preparedRollExplanation, tags: tags });
            rollObject.options.rollOptions = rollOptions;
            const roll = await rollObject.evaluate();

            // Flag critical thresholds
            for (const d of roll.dice) {
                if (d.faces === 20) {
                    d.options.critical = critical;
                    d.options.fumble = fumble;
                }
            }

            // if (flavor) {
            //     const chatData = {
            //         type: CONST.CHAT_MESSAGE_STYLES.IC,
            //         speaker: speaker,
            //         content: flavor
            //     };

            //     ChatMessage.create(chatData, { chatBubble: true });
            // }

            const itemContext = rollContext.allContexts['item'];
            const htmlData = [{ name: "rollNotes", value: itemContext?.system?.rollNotes }];

            let useCustomCard = game.settings.get("sfrpg", "useCustomChatCards");
            let errorToThrow = null;
            if (useCustomCard && chatMessage) {
                // Push the roll to the ChatBox
                const customData = {
                    title: flavor,
                    rollContext,
                    speaker,
                    rollMode,
                    breakdown: preparedRollExplanation,
                    htmlData,
                    rollType: "normal",
                    rollOptions,
                    rollDices: finalFormula.rollDices
                };

                try {
                    useCustomCard = SFRPGCustomChatMessage.renderStandardRoll(roll, customData);
                } catch (error) {
                    useCustomCard = false;
                    errorToThrow = error;
                }
            }

            if (!useCustomCard && chatMessage) {
                const messageData = {
                    flavor,
                    speaker,
                    rollMode,
                    rolls: [roll],
                    sound: CONFIG.sounds.dice,
                    flags: { rollOptions }
                };

                messageData.content = await roll.render({ htmlData: htmlData, customTooltip: finalFormula.rollDices });
                if (rollOptions?.actionTarget) {
                    messageData.content = DiceSFRPG.appendTextToRoll(messageData.content, game.i18n.format("SFRPG.Items.Action.ActionTarget.ChatMessage", {actionTarget: rollOptions.actionTargetSource[rollOptions.actionTarget]}));
                }

                ChatMessage.create(messageData);
            }

            if (onClose) {
                onClose(roll, formula, finalFormula);
            }

            if (errorToThrow) {
                throw errorToThrow;
            }

            return roll;
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
    * @param {Object}             data               The parameters passed into the method.
    * @param {Event|JQuery.Event} [data.event]       The triggering event which initiated the roll
    * @param {String}             [data.rollFormula] The roll formula to use, excluding the initial die. If left empty, will look for parts.
    * @param {string[]}           data.parts         The dice roll component parts, excluding the initial die
    * @param {RollContext}        data.rollContext   The contextual data for this roll
    * @param {String}             data.title         The dice roll UI window title
    * @param {String}             [data.mainDie]     The main die to use for this roll, e.g. "d20".
    * @param {Boolean}            [data.advantage]   Allow rolling with advantage (and therefore also with disadvantage)
    * @param {Number}             [data.critical]    The value of d20 result which represents a critical success
    * @param {Number}             [data.fumble]      The value of d20 result which represents a critical failure
    * @param {string}             [data.breakdown]   An explanation of the roll modifiers and where they came from.
    * @param {Tag[]}              [data.tags]        Any roll metadata that will be output on the bottom of the chat card.
    * @param {DialogOptions}      data.dialogOptions Modal dialog options
    * @returns {Promise<RollResult>|Promise} Returns the roll's result or an empty promise.
    */
    static async createRoll({ event = new Event(''), rollFormula = null, parts, rollContext, title, mainDie = "d20", advantage = true, critical = 20, fumble = 1, breakdown = "", tags = [], dialogOptions, useRawStrings = false, actorContextKey = "actor" }) {

        if (!rollContext?.isValid()) {
            console.log(['Invalid rollContext', rollContext]);
            return null;
        }

        /** New roll formula system */
        const buttons = {};
        if (game.settings.get("sfrpg", "useAdvantageDisadvantage") && advantage) {
            buttons["Disadvantage"] = { id: "disadvantage", label: game.i18n.format("SFRPG.Rolls.Dice.Disadvantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.DisadvantageTooltip") };
            buttons["Normal"] = { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.Normal"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalTooltip") };
            buttons["Advantage"] = { id: "advantage", label: game.i18n.format("SFRPG.Rolls.Dice.Advantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.AdvantageTooltip") };
        } else {
            buttons["Normal"] = { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.Roll") };
        }

        const options = {
            debug: false,
            buttons: buttons,
            defaultButton: "normal",
            title: title,
            skipUI: ((game.settings.get('sfrpg', 'useQuickRollAsDefault')) ? !event?.shiftKey : event?.shiftKey || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            mainDie: mainDie ? "1" + mainDie : null,
            dialogOptions: dialogOptions,
            useRawStrings: useRawStrings
        };

        const formula = rollFormula || parts.join(" + ");

        const tree = new RollTree(options);
        if (dialogOptions?.skipUI) {
            /** @type {RollResult|null} */
            let result = null;
            await tree.buildRoll(formula, rollContext, async (button, rollMode, unusedFinalFormula, node, rollMods, bonus = null) => {
                const finalFormula = await this._calcStackingFormula(node, rollMods, bonus, rollContext.allContexts[actorContextKey]?.entity);

                if (mainDie) {
                    let dieRoll = "1" + mainDie;
                    if (mainDie === "d20") {
                        if (button === "disadvantage") {
                            dieRoll = "2d20kl";
                        } else if (button === "advantage") {
                            dieRoll = "2d20kh";
                        }
                    }

                    finalFormula.finalRoll = `${dieRoll} + ${finalFormula.finalRoll}`;
                    finalFormula.formula = `${dieRoll} + ${finalFormula.formula}`;
                }

                const rollObject = Roll.create(finalFormula.finalRoll, { breakdown, tags, skipUI: true });
                const roll = await rollObject.evaluate();
                roll.options.rollMode = rollMode;

                // Flag critical thresholds
                for (const d of roll.dice) {
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
                tree.buildRoll(formula, rollContext, async (button, rollMode, unusedFinalFormula, node, rollMods, bonus = null) => {
                    if (button === "cancel") {
                        resolve(null);
                        return;
                    }

                    const finalFormula = await this._calcStackingFormula(node, rollMods, bonus, rollContext.allContexts[actorContextKey]?.entity);

                    if (mainDie) {
                        let dieRoll = "1" + mainDie;
                        if (mainDie === "d20") {
                            if (button === "Disadvantage") {
                                dieRoll = "2d20kl";
                            } else if (button === "Advantage") {
                                dieRoll = "2d20kh";
                            }
                        }
                        finalFormula.finalRoll = `${dieRoll} + ${finalFormula.finalRoll}`;
                        finalFormula.formula = `${dieRoll} + ${finalFormula.formula}`;
                    }

                    finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ")
                        .trim();
                    finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;

                    const rollObject = Roll.create(finalFormula.finalRoll, { breakdown, tags });
                    const roll = await rollObject.evaluate();
                    roll.options.rollMode = rollMode;

                    // Flag critical thresholds
                    for (const d of roll.dice) {
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

    /**
    * A standardized helper function for managing core Starfinder damage rolls.
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
    *
    * @param {Object}               data               Parameters passed into the method
    * @param {Event}                [data.event]       The triggering event which initiated the roll
    * @param {DamagePart[]}         data.parts         The dice roll component parts
    * @param {CriticalDamage}       data.criticalData  Critical damage information, in case of a critical hit
    * @param {RollContext}          data.rollContext   The contextual data for this roll
    * @param {String}               data.title         The dice roll UI window title
    * @param {SpeakerData}          data.speaker       The ChatMessage speaker to pass when creating the chat
    * @param {string}               data.flavor        Any flavor text associated with this roll
    * @param {onDamageDialogClosed} data.onClose       Callback for actions to take when the dialog form is closed
    * @param {Object}               data.dialogOptions Modal dialog options
    */
    static async damageRoll({ event = new Event(''), parts, criticalData, rollContext, title, speaker, flavor, chatMessage = true, onClose, dialogOptions }) {
        flavor = `${title || ""}${(flavor ? " - " + flavor : "")}`;

        if (!rollContext?.isValid()) {
            console.log(['Invalid rollContext', rollContext]);
            return null;
        }

        /** New roll formula system */
        const buttons = {
            Normal: { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.NormalDamage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalDamageTooltip") },
            Critical: { id: "critical", label: game.i18n.format("SFRPG.Rolls.Dice.CriticalDamage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.CriticalDamageTooltip") }
        };

        const getDamageTypeForPart = (part) => {
            if (part.types && !foundry.utils.isEmpty(part.types)) {
                const filteredTypes = Object.entries(part.types).filter(type => type[1]);
                const obj = { types: [], operator: "" };

                for (const type of filteredTypes) {
                    obj.types.push(type[0]);
                }

                obj.operator = "and";

                return obj;
            }
        };

        /** @type {DamageType[]} */
        const damageTypes = parts.reduce((acc, cur) => {
            if (cur.types && !foundry.utils.isEmpty(cur.types)) {
                const filteredTypes = Object.entries(cur.types).filter(type => type[1]);
                const obj = { types: [], operator: "" };

                for (const type of filteredTypes) {
                    obj.types.push(type[0]);
                }

                if (cur.operator) obj.operator = cur.operator;

                if (obj.types.length > 0)
                    acc.push(obj);
            }

            return acc;
        }, []);

        const options = {
            debug: false,
            buttons: buttons,
            defaultButton: "normal",
            title: title,
            skipUI: ((game.settings.get('sfrpg', 'useQuickRollAsDefault')) ? !event?.shiftKey : event?.shiftKey || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            mainDie: "",
            dialogOptions: dialogOptions,
            parts,
            useRawStrings: false
        };

        const finalParts = [];
        const damageSections = [];
        for (const part of parts) {
            if (part instanceof Object) {
                if (part.isDamageSection) {
                    damageSections.push(part);

                    const additionalOptions = foundry.utils.deepClone(options);
                    additionalOptions.skipUI = true;

                    const tempTree = new RollTree(additionalOptions);
                    const evaluatedPartFormula = await tempTree.buildRoll(part.formula, rollContext, async (button, rollMode, finalFormula, na) => {
                        part.formula = finalFormula.finalRoll;
                    });
                    continue;
                }

                if (part.explanation) {
                    if (part.formula) {
                        finalParts.push(`${part.formula}[${part.explanation}]`);
                    } else {
                        finalParts.push(`0[${part.explanation}]`);
                    }
                } else {
                    if (part.formula) {
                        finalParts.push(`${part.formula}`);
                    } else {
                        finalParts.push(`0`);
                    }
                }
            } else {
                finalParts.push(formula);
            }
        }

        if (damageSections.length > 0) {
            finalParts.splice(0, 0, "<damageSection>");
        }

        const formula = finalParts.join(" + ");
        const tree = new RollTree(options);
        return await tree.buildRoll(formula, rollContext, async (button, rollMode, finalFormula, part) => {
            if (button === 'cancel') {
                if (onClose) {
                    onClose(null, null, null, false);
                }
                return null;
            }

            /** @type {Tag[]} */
            const tags = [];
            /** @type {HtmlData[]} */
            const htmlData = [{ name: "is-damage", value: "true" }];

            const usedParts = part ? [part] : parts;
            if (part) {
                part.operator = "and";
            }

            let damageTypeString = "";
            const tempParts = usedParts.reduce((arr, curr) => {
                const obj = { formula: curr.formula, damage: 0, types: [], operator: curr.operator };
                if (curr.types && !foundry.utils.isEmpty(curr.types)) {
                    for (const [key, isEnabled] of Object.entries(curr.types)) {
                        if (isEnabled) {
                            obj.types.push(key);
                        }
                    }
                }

                if (obj.types && obj.types.length > 0) {
                    const tag = `damage-type-${(obj.types.join(`-${obj.operator}-`))}`;
                    const text = obj.types.map(type => SFRPG.damageTypes[type]).join(` ${SFRPG.damageTypeOperators[obj.operator]} `);
                    const shortText = obj.types.map(type => SFRPG.damageTypeToAcronym[type]).join(` & `);

                    // In most use cases, damage rolls should never contain more parts. But because the system is complex and confusing, it is theoretically possible.
                    // If that happens, we'll just concatenate the damage types to the roll string and pretend nothing is wrong.
                    if (damageTypeString?.length > 0) {
                        damageTypeString += ", ";
                    }
                    damageTypeString += shortText;

                    if (!tags.some(t => t.tag === tag && t.text === text))
                        tags.push({ tag: tag, text: text });
                }

                arr.push(obj);
                return arr;
            }, []);

            // if (damageTypes) {
            //     for (const damageType of damageTypes) {
            //         const tag = "damage-type-" + damageType.types.join(`-${damageType.operator}-`);
            //         const text = damageType.types.map(type => SFRPG.damageTypes[type]).join(` ${SFRPG.damageTypeOperators[damageType.operator]} `);

            //         tags.push({ tag: tag, text: text });
            //     }
            // }

            const itemContext = rollContext.allContexts['item'];
            if (itemContext) {
                /** Regular Weapons use data.properties for their properties */
                if (itemContext.entity.system.properties) {
                    try {
                        const props = [];
                        for (const [key, isEnabled] of Object.entries(itemContext.entity.system.properties)) {
                            if (isEnabled) {
                                tags.push({tag: `weapon-properties ${key}`, text: SFRPG.weaponProperties[key]});
                                props.push(key);
                            }
                        }
                        htmlData.push({ name: "weapon-properties", value: JSON.stringify(props) });
                    } catch { }
                }

                /** Starship Weapons use data.special for their properties */
                if (itemContext.entity.type === "starshipWeapon") {
                    tags.push({tag: `starship-weapon-type ${itemContext.entity.system.weaponType}`, text: SFRPG.starshipWeaponTypes[itemContext.entity.system.weaponType]});
                    htmlData.push({ name: "starship-weapon-type", value: itemContext.entity.system.weaponType });

                    if (itemContext.entity.system.special) {
                        try {
                            const props = [];
                            for (const [key, isEnabled] of Object.entries(itemContext.entity.system.special)) {
                                if (isEnabled) {
                                    tags.push({tag: `starship-weapon-properties ${key}`, text: SFRPG.starshipWeaponProperties[key]});
                                    props.push(key);
                                }
                            }
                            htmlData.push({ name: "starship-weapon-properties", value: JSON.stringify(props) });
                        } catch { }
                    }
                }

                const specialMaterials = itemContext.entity.system.specialMaterials;
                if (specialMaterials) {
                    for (const [material, isEnabled] of Object.entries(specialMaterials)) {
                        if (isEnabled) {
                            tags.push({tag: material, text: SFRPG.specialMaterials[material]});
                        }
                    }
                }
            }

            const isCritical = (button === "critical");
            let finalFlavor = foundry.utils.deepClone(flavor);
            if (isCritical) {
                htmlData.push({ name: "is-critical", value: "true" });
                tags.push({tag: `critical`, text: game.i18n.localize("SFRPG.Rolls.Dice.CriticalHit")});

                if (!criticalData?.preventDoubling) {
                    finalFormula.finalRoll = finalFormula.finalRoll + " + " + finalFormula.finalRoll;
                    finalFormula.formula = finalFormula.formula + " + " + finalFormula.formula;
                }

                let tempFlavor = game.i18n.format("SFRPG.Rolls.Dice.CriticalFlavor", { "title": finalFlavor });

                if (criticalData !== undefined) {
                    if (criticalData?.effect?.trim().length > 0) {
                        tempFlavor = game.i18n.format("SFRPG.Rolls.Dice.CriticalFlavorWithEffect", { "title": finalFlavor, "criticalEffect": criticalData.effect });
                        tags.push({ tag: "critical-effect", text: game.i18n.format("SFRPG.Rolls.Dice.CriticalEffect", {"criticalEffect": criticalData.effect })});
                    }

                    const critRoll = criticalData.parts?.filter(x => x.formula?.trim().length > 0).map(x => x.formula)
                        .join("+") ?? "";
                    if (critRoll.length > 0) {
                        finalFormula.finalRoll = finalFormula.finalRoll + " + " + critRoll;
                        finalFormula.formula = finalFormula.formula + " + " + critRoll;
                    }

                    htmlData.push({ name: "critical-data", value: JSON.stringify(criticalData) });
                }

                finalFlavor = tempFlavor;
            }

            if (part?.name) {
                finalFlavor += `: ${part.name}`;
                if (part.partIndex) {
                    finalFlavor += ` (${part.partIndex})`;
                }
                // const originalTypes = foundry.utils.deepClone(damageTypes);
                // damageTypes = [getDamageTypeForPart(part)];
                // console.log([originalTypes, damageTypes]);
            }

            finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ")
                .trim();
            finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;
            const preparedRollExplanation = DiceSFRPG.formatFormula(finalFormula.formula);

            const rollObject = Roll.create(finalFormula.finalRoll, { tags: tags, breakdown: preparedRollExplanation });
            const roll = await rollObject.evaluate();

            // CRB pg. 240, < 1 damage returns 1 non-lethal damage.
            if (roll._total < 1) {
                roll._total = 1;
                const nonlethal = tags.find(e => e.tag === "weapon-properties nonlethal");

                if (itemContext.type !== "starshipWeapon") {
                    if (nonlethal) {
                        nonlethal.text += ` (${game.i18n.localize("SFRPG.Damage.MinimumDamage")})`;
                    } else {
                        tags.push({ tag: "nonlethal", text: game.i18n.format("SFRPG.Damage.Types.Nonlethal") + ` (${game.i18n.localize("SFRPG.Damage.MinimumDamage")})`});
                    }
                } else {
                    tags.push({ tag: "minimum-damage", text: game.i18n.localize("SFRPG.Damage.MinimumDamage") });
                }
            }

            // Associate the damage types for this attack to the first DiceTerm
            // for the roll.
            const die = roll.dice && roll.dice.length > 0 ? roll.dice[0] : null;

            if (die) {
                /** @type {boolean} */
                die.options.isDamageRoll = true;
                die.options.damageTypes = damageTypes;
                die.options.damageParts = tempParts;

                if (criticalData) {
                    die.options.criticalData = criticalData;
                }

                const properties = rollContext.allContexts["item"]?.data?.properties;
                if (properties) {
                    die.options.isModal = properties.modal || properties.double;
                }
            }

            htmlData.push({ name: "damage-parts", value: JSON.stringify(tempParts) });
            htmlData.push({ name: "rollNotes", value: itemContext?.data?.damageNotes });

            let useCustomCard = game.settings.get("sfrpg", "useCustomChatCards");
            let errorToThrow = null;
            if (useCustomCard && chatMessage) {
                // Push the roll to the ChatBox
                const customData = {
                    title: finalFlavor,
                    rollContext:  rollContext,
                    speaker: speaker,
                    rollMode: rollMode,
                    breakdown: preparedRollExplanation,
                    tags: tags,
                    htmlData: htmlData,
                    rollType: "damage",
                    damageTypeString: damageTypeString
                };

                if (itemContext && itemContext.entity.system.specialMaterials) {
                    customData.specialMaterials = itemContext.entity.system.specialMaterials;
                }

                try {
                    useCustomCard = SFRPGCustomChatMessage.renderStandardRoll(roll, customData);
                } catch (error) {
                    useCustomCard = false;
                    errorToThrow = error;
                }
            }

            if (!useCustomCard && chatMessage) {
                const rollContent = await roll.render({ htmlData: htmlData });

                const messageData = {
                    flavor: finalFlavor,
                    speaker,
                    content: rollContent,
                    rollMode,
                    rolls: [roll],
                    sound: CONFIG.sounds.dice
                };

                // Insert the damage type string if possible.
                if (damageTypeString?.length > 0) {
                    messageData.content = DiceSFRPG.appendTextToRoll(rollContent, damageTypeString);
                    messageData.flags = {
                        damage: {
                            amount: roll.total,
                            types: damageTypeString?.replace(' & ', ',')?.toLowerCase() ?? ""
                        }
                    };

                    if (itemContext && itemContext.entity.system.specialMaterials) {
                        messageData.flags.specialMaterials = itemContext.entity.system.specialMaterials;
                    }
                }

                ChatMessage.create(messageData);
            }

            if (onClose) {
                onClose(roll, formula, finalFormula, isCritical);
            }

            if (errorToThrow) {
                throw errorToThrow;
            }

            return roll;
        });
    }

    static appendTextToRoll(originalRollHTML, textToAppend) {
        const diceRollHtml = '<h4 class="dice-roll">';

        const diceRollIndex = originalRollHTML.indexOf(diceRollHtml);
        const firstHalf = originalRollHTML.substring(0, diceRollIndex + diceRollHtml.length);
        const splitOffFirstHalf = originalRollHTML.substring(diceRollIndex + diceRollHtml.length);

        const closeTagIndex = splitOffFirstHalf.indexOf('</h4>');
        const rollResultHtml = splitOffFirstHalf.substring(0, closeTagIndex);
        const secondHalf = splitOffFirstHalf.substring(closeTagIndex);

        const combinedResult = firstHalf + rollResultHtml + ` ${textToAppend}` + secondHalf;
        return combinedResult;
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

        const roll = message.rolls[0];
        if (!roll.dice.length) return;
        for (const d of roll.dice) {
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

        const roll = message.rolls[0];
        if (!(roll?.dice.length > 0)) return;
        for (const die of roll.dice) {
            if (die?.options?.isDamageRoll) {
                const types = die?.options?.damageTypes;
                const critical = die?.options?.criticalData;

                html.data("damageTypes", types);
                html.data("critical", critical);
            }
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
                finalResult += section.text.replace(/\+/gi, "<br /> +").replace(/-/gi, "<br /> -");
            } else {
                finalResult += section.text;
            }
        }
        return finalResult;
    }

    static resolveFormulaWithoutDice(sourceFormula, rollContext, options = {logErrors: true}) {
        const resolveResult = {
            sourceFormula: sourceFormula,
            evaluatedFormula: null,
            total: 0,
            hadError: false
        };

        let resultValue = 0;

        const tree = new RollTree({skipUI: true});
        tree.buildRoll(sourceFormula, rollContext, async (button, rollMode, finalFormula) => {
            try {
                const formula = Roll.replaceFormulaData(finalFormula.finalRoll, null);
                resultValue = Roll.safeEval(formula);
                resolveResult.evaluatedFormula = formula;
            } catch (error) {
                if (options?.logErrors) {
                    console.error(['Failed to evaluate diceless formula, are there dice terms in there?', sourceFormula, rollContext, finalFormula.finalRoll, error]);
                }
                resolveResult.hadError = true;
            }
        });

        if (!resolveResult.hadError) {
            try {
                const finalResult = eval(resultValue);
                const finalNumber = Number(finalResult);
                if (!Number.isNaN(finalNumber)) {
                    resolveResult.total = finalNumber;
                } else {
                    if (options?.logErrors) {
                        console.log(['Failed to evaluate diceless formula to a number', sourceFormula, rollContext, resultValue]);
                    }
                    resolveResult.hadError = true;
                }
            } catch (error) {
                if (options?.logErrors) {
                    console.log(['Error resolving diceless formula', sourceFormula, rollContext, error]);
                }
                resolveResult.hadError = true;
            }
        }

        return resolveResult;
    }

    /**
     * returns the rootNode with removed childnodes that match the modifier.
     * @param {RollNode} rootNode
     * @param {Object} modifier
     */
    static _removeModifierNodes(rootNode, modifier) {
        let node = rootNode;
        const childKeys = Object.keys(node.childNodes);
        for (let nodeI = 0; nodeI < childKeys.length; nodeI++) {
            const childNode = node.childNodes[childKeys[nodeI]];
            if (modifier._id && (childNode.referenceModifier?._id === modifier._id)) {
                delete node.childNodes[childKeys[nodeI]];
            } else if (Object.keys(childNode.childNodes).length > 0) {
                node = this._removeModifierNodes(childNode, modifier).parentNode;
            }
        }
        return node;
    }

    /**
     * Calculates the final formula used for rolls with applied stacking of the modifiers
     * @param {RollNode} node - the Rootnode which is used for the roll
     * @param {Array} rollMods - all modifiers applied to this roll (unstacked)
     * @param {Number} bonus - the situational bonus for this roll
     * @returns {Object} finalFormula Object: {finalRoll: String, formula: String}
     */
    static async _calcStackingFormula(node, rollMods, bonus = null, actor = null) {
        let rootNode = node;

        const stackModifiers = new StackModifiers();
        const stackedMods = await stackModifiers.processAsync(rollMods.filter(mod => {
            if (mod.enabled && mod.type) {
                rootNode = this._removeModifierNodes(rootNode, mod);
                return true;
            }
        }), null, { actor: actor });

        let rollString = '';
        let formulaString = '';
        const rollDices = [];
        const stackedModsArray = Object.keys(stackedMods);
        for (let stackModsI = 0; stackModsI < stackedModsArray.length; stackModsI++) {
            const stackModifier = stackedMods[stackedModsArray[stackModsI]];
            if (stackModifier === null || stackModifier === undefined) {
                continue;
            }
            if (stackModifier instanceof Array) {
                for (let stackModifierI = 0; stackModifierI < stackModifier.length; stackModifierI++) {
                    const modifier = stackModifier[stackModifierI];
                    rollString += `${modifier.max.toString()}+`;
                    // TODO:
                    /*
                        add title to the span f.e.:
                        title="${game.i18n.format(localizationKey, type: modifier.type.capitalize(),mod: modifier.max.signedString(),source: modifier.name)}"
                        but in order to do that we will need the localization key for the current modifier which we do not have at this point. Maybe we will have to pass it down from the modifier calculation lol.
                    */
                    if (!modifier.isDeterministic) {
                        rollDices.push(...modifier.dices);
                        formulaString += `${modifier.max.toString()}(${modifier.modifier})[<span>${modifier.name}</span>] + `;
                    } else {
                        formulaString += `${modifier.max.toString()}[<span>${modifier.name}</span>] + `;
                    }
                }
            } else {
                rollString += `${stackModifier.max.toString()}+`;
                // TODO:
                /*
                    add title to the span f.e.:
                    title="${game.i18n.format(localizationKey, type: modifier.type.capitalize(),mod: modifier.max.signedString(),source: modifier.name)}"
                    but in order to do that we will need the localization key for the current modifier which we do not have at this point. Maybe we will have to pass it down from the modifier calculation lol.
                */
                if (!stackModifier.isDeterministic) {
                    rollDices.push(...stackModifier.dices);
                    formulaString += `${stackModifier.max.toString()}(${stackModifier.modifier})[<span>${stackModifier.name}</span>] + `;
                } else {
                    formulaString += `${stackModifier.max.toString()}[<span>${stackModifier.name}</span>] + `;
                }
            }
        }

        formulaString += bonus ? `${bonus.toString()}[<span>${game.i18n.localize("SFRPG.Rolls.Dialog.SituationalBonus")}</span>]` : '';

        rollString += bonus ? `${bonus}` : '';
        rollString = rollString.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ")
            .trim();
        rollString = rollString.endsWith("+") ? rollString.substring(0, rollString.length - 1).trim() : rollString;

        const finalFormula = rootNode.resolveForRoll(0, rollMods);

        finalFormula.finalRoll = rollString ? `${finalFormula.finalRoll} + ${rollString}` : finalFormula.finalRoll;
        finalFormula.formula = formulaString ? `${finalFormula.formula} + ${formulaString}` : finalFormula.formula;

        finalFormula.formula = finalFormula.formula.replace(/\+ -/gi, "- ").replace(/\+ \+/gi, "+ ")
            .trim();
        finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;

        finalFormula.rollDices = rollDices;

        return finalFormula;
    }

    /**
     * The below is copied from the DnD5e system on Foundry (https://github.com/foundryvtt/dnd5e/blob/master/module/dice/simplify-roll-formula.mjs) under the MIT License.
     *
     * Copyright 2021 Andrew Clayton
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
     * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
     */

    /**
     * A standardized helper function for simplifying the constant parts of a multipart roll formula.
     *
     * @param {string} formula                          The original roll formula.
     * @param {object} [options]                        Formatting options.
     * @param {boolean} [options.preserveFlavor=false]  Preserve flavor text in the simplified formula.
     *
     * @returns {string}  The resulting simplified formula.
     */
    static simplifyRollFormula(formula, { preserveFlavor = false } = {}) {
        // Create a new roll and verify that the formula is valid before attempting simplification.
        let roll;
        try { roll = Roll.create(formula); } catch (err) { console.warn(`Unable to simplify formula '${formula}': ${err}`); }
        Roll.validate(roll.formula);

        // Optionally strip flavor annotations.
        if ( !preserveFlavor ) roll.terms = Roll.parse(roll.formula.replace(foundry.dice.terms.RollTerm.FLAVOR_REGEXP, ""));

        // Perform arithmetic simplification on the existing roll terms.
        roll.terms = DiceSFRPG.#simplifyOperatorTerms(roll.terms);

        if ( /[*/]/.test(roll.formula) ) {
            return ( roll.isDeterministic ) && ( !/\[/.test(roll.formula) || !preserveFlavor )
                ? roll.evaluateSync().total.toString()
                : roll.constructor.getFormula(roll.terms);
        }

        // Flatten the roll formula and eliminate string terms.
        roll.terms = DiceSFRPG.#expandParentheticalTerms(roll.terms);
        roll.terms = Roll.simplifyTerms(roll.terms);

        // Group terms by type and perform simplifications on various types of roll term.
        let { poolTerms, diceTerms, functionTerms, numericTerms } = DiceSFRPG.#groupTermsByType(roll.terms);
        numericTerms = DiceSFRPG.#simplifyNumericTerms(numericTerms ?? []);
        diceTerms = DiceSFRPG.#simplifyDiceTerms(diceTerms ?? []);

        // Recombine the terms into a single term array and remove an initial + operator if present.
        const simplifiedTerms = [diceTerms, poolTerms, functionTerms, numericTerms].flat().filter(Boolean);
        if ( simplifiedTerms[0]?.operator === "+" ) simplifiedTerms.shift();
        return simplifiedTerms.map(t => t.formula).join(" ");
    }

    /* -------------------------------------------- */

    /**
    * A helper function to perform arithmetic simplification and remove redundant operator terms.
    * @param {RollTerm[]} terms  An array of roll terms.
    * @returns {RollTerm[]}      A new array of roll terms with redundant operators removed.
    */
    static #simplifyOperatorTerms(terms) {
        const t = foundry.dice.terms;
        return terms.reduce((acc, term) => {
            const prior = acc[acc.length - 1];
            const ops = new Set([prior?.operator, term.operator]);

            // If one of the terms is not an operator, add the current term as is.
            if ( ops.has(undefined) ) acc.push(term);

            // Replace consecutive "+ -" operators with a "-" operator.
            else if ( (ops.has("+")) && (ops.has("-")) ) acc.splice(-1, 1, new t.OperatorTerm({ operator: "-" }));

            // Replace double "-" operators with a "+" operator.
            else if ( (ops.has("-")) && (ops.size === 1) ) acc.splice(-1, 1, new t.OperatorTerm({ operator: "+" }));

            // Don't include "+" operators that directly follow "+", "*", or "/". Otherwise, add the term as is.
            else if ( !ops.has("+") ) acc.push(term);

            return acc;
        }, []);
    }

    /* -------------------------------------------- */

    /**
    * A helper function for combining unannotated numeric terms in an array into a single numeric term.
    * @param {object[]} terms  An array of roll terms.
    * @returns {object[]}      A new array of terms with unannotated numeric terms combined into one.
    */
    static #simplifyNumericTerms(terms) {
        const t = foundry.dice.terms;
        const simplified = [];
        const { annotated, unannotated } = DiceSFRPG.#separateAnnotatedTerms(terms);

        // Combine the unannotated numerical bonuses into a single new NumericTerm.
        if ( unannotated.length ) {
            const staticBonus = Roll.safeEval(Roll.getFormula(unannotated));
            if ( staticBonus === 0 ) return [...annotated];

            // If the staticBonus is greater than 0, add a "+" operator so the formula remains valid.
            if ( staticBonus > 0 ) simplified.push(new t.OperatorTerm({ operator: "+"}));
            simplified.push(new t.NumericTerm({ number: staticBonus }));

        }
        return [...simplified, ...annotated];
    }

    /* -------------------------------------------- */

    /**
    * A helper function to group dice of the same size and sign into single dice terms.
    * @param {object[]} terms  An array of DiceTerms and associated OperatorTerms.
    * @returns {object[]}      A new array of simplified dice terms.
    */
    static #simplifyDiceTerms(terms) {
        const t = foundry.dice.terms;
        const { annotated, unannotated } = DiceSFRPG.#separateAnnotatedTerms(terms);

        // Split the unannotated terms into different die sizes and signs
        const diceQuantities = unannotated.reduce((obj, term, i) => {
            if ( term instanceof t.OperatorTerm ) return obj;

            if (term._number instanceof Roll) {
                // Complex number term.
                if ( !term._number.isDeterministic ) return obj;
                if ( !term._number._evaluated ) term._number.evaluateSync();
            }

            if (term._faces instanceof Roll) {
                // Complex number term.
                if ( !term._faces.isDeterministic ) return obj;
                if ( !term._faces._evaluated ) term._faces.evaluateSync();
            }

            const key = `${unannotated[i - 1].operator}${term.faces}`;
            obj[key] = (obj[key] ?? 0) + term.number;
            return obj;
        }, {});

        // Add new die and operator terms to simplified for each die size and sign
        const simplified = Object.entries(diceQuantities).flatMap(([key, number]) => ([
            new t.OperatorTerm({ operator: key.charAt(0) }),
            new t.Die({ number, faces: parseInt(key.slice(1)) })
        ]));
        return [...simplified, ...annotated];
    }

    /* -------------------------------------------- */

    /**
    * A helper function to extract the contents of parenthetical terms into their own terms.
    * @param {object[]} terms  An array of roll terms.
    * @returns {object[]}      A new array of terms with no parenthetical terms.
    */
    static #expandParentheticalTerms(terms) {
        const t = foundry.dice.terms;
        terms = terms.reduce((acc, term) => {
            if ( term instanceof t.ParentheticalTerm ) {
                if ( term.isDeterministic ) term = new t.NumericTerm({ number: Roll.safeEval(term.term) });
                else {
                    const subterms = new Roll(term.term).terms;
                    term = DiceSFRPG.#expandParentheticalTerms(subterms);
                }
            }
            acc.push(term);
            return acc;
        }, []);
        return DiceSFRPG.#simplifyOperatorTerms(terms.flat());
    }

    /* -------------------------------------------- */

    /**
    * A helper function to group terms into PoolTerms, DiceTerms, FunctionTerms, and NumericTerms.
    * FunctionTerms are included as NumericTerms if they are deterministic.
    * @param {RollTerm[]} terms  An array of roll terms.
    * @returns {object}          An object mapping term types to arrays containing roll terms of that type.
    */
    static #groupTermsByType(terms) {
        const t = foundry.dice.terms;
        // Add an initial operator so that terms can be rearranged arbitrarily.
        if ( !(terms[0] instanceof t.OperatorTerm) ) terms.unshift(new t.OperatorTerm({ operator: "+" }));

        return terms.reduce((obj, term, i) => {
            let type;
            if ( term instanceof t.DiceTerm ) type = t.DiceTerm;
            else if ( (term instanceof t.FunctionTerm) && (term.isDeterministic) ) type = NumericTerm;
            else type = term.constructor;
            const key = `${type.name.charAt(0).toLowerCase()}${type.name.substring(1)}s`;

            // Push the term and the preceding OperatorTerm.
            (obj[key] = obj[key] ?? []).push(terms[i - 1], term);
            return obj;
        }, {});
    }

    /* -------------------------------------------- */

    /**
    * A helper function to separate annotated terms from unannotated terms.
    * @param {object[]} terms     An array of DiceTerms and associated OperatorTerms.
    * @returns {Array | Array[]}  A pair of term arrays, one containing annotated terms.
    */
    static #separateAnnotatedTerms(terms) {
        const t = foundry.dice.terms;
        return terms.reduce((obj, curr, i) => {
            if ( curr instanceof t.OperatorTerm ) return obj;
            obj[curr.flavor ? "annotated" : "unannotated"].push(terms[i - 1], curr);
            return obj;
        }, { annotated: [], unannotated: [] });
    }
}
