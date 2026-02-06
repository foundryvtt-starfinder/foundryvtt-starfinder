import { SFRPG } from "./config.js";
import RollTree from "./rolls/rolltree.js";
import StackModifiers from "./rules/closures/stack-modifiers.js";
import SFRPGRoll from "./rolls/roll.js";
import { ChatMessageSFRPG } from "./chat/message.js";

/**
 * @import SFRPGRoll from "./rolls/roll.js";
 * @import RollContext from "./rolls/rollcontext.js";
 * @import ActorSFRPG from "./actor/actor.js";
 * @import RollInfo from "./rolls/rolltree.js";
 * @import {HtmlData, RollCriteria, Tag} from "./rolls/roll.js"
 * @import SFRPGModifier from "./modifiers/modifier.js"
 */

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
 * @property {SFRPGRoll} roll The data for the roll
 * @property {FinalFormula} formula The finalized formula used in the roll
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
     * Roll dialog buttons for normal rolls
     * @type {Object}
     */
    static get normalRollButtons() {
        return {
            Normal: {
                id: "normal",
                label: game.i18n.localize("SFRPG.Rolls.Dice.Roll")
            }
        };
    }

    /**
     * Roll dialog buttons for rolls where advantage is enabled
     * @type {Object}
     */
    static get advantageRollButtons() {
        return {
            "Disadvantage": { id: "disadvantage", label: game.i18n.format("SFRPG.Rolls.Dice.Disadvantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.DisadvantageTooltip") },
            "Normal": { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.Normal"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalTooltip") },
            "Advantage": { id: "advantage", label: game.i18n.format("SFRPG.Rolls.Dice.Advantage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.AdvantageTooltip") }
        };
    }

    /**
     * Roll dialog buttons for normal rolls
     * @type {Object}
     */
    static get damageRollButtons() {
        return {
            Normal: { id: "normal", label: game.i18n.format("SFRPG.Rolls.Dice.NormalDamage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.NormalDamageTooltip") },
            Critical: { id: "critical", label: game.i18n.format("SFRPG.Rolls.Dice.CriticalDamage"), tooltip: game.i18n.format("SFRPG.Rolls.Dice.CriticalDamageTooltip") }
        };
    }

    /**
    * A standardized helper function for managing core Starfinder "d20 rolls"
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
    *
    * @param {Object}               data                    The parameters passed into the method
    * @param {string[]}             data.parts              The dice roll component parts, excluding the initial d20
    * @param {RollContext}          data.rollContext        The contextual data for this roll
    * @param {RollCriteria}         data.rollCriteria       Additional data to further define the roll and what it's doing
    * @param {SpeakerData}          data.speaker            The ChatMessage speaker to pass when creating the chat (optional if chatMessage is false)
    * @param {string}               [data.actorContextKey]  Key for evaluating the correct rollContext entry when calculating formulas
    * @param {boolean}              [data.chatMessage]      Whether to create & show a chat message after making the roll
    * @param {DialogOptions}        [data.dialogOptions]    Modal dialog options
    * @param {string}               [data.flavor]           Any flavor text associated with this roll
    * @param {onD20DialogClosed}    [data.onClose]          Callback for actions to take when the dialog form is closed
    * @param {boolean}              [data.skipUI]           The triggering event which initiated the roll
    * @param {Tag[]}                [data.tags]             Any roll metadata that will be output on the bottom of the chat card
    * @param {string}               [data.title]            The dice roll UI window title
    * @returns {Promise<RollResult?>}
    */
    static async d20Roll({ parts = [], rollContext, rollCriteria, speaker,
        actorContextKey = "actor", chatMessage = true, dialogOptions, flavor, onClose, skipUI = false, tags = [], title}) {

        // Verify roll context is valid before continuing
        if (!rollContext?.isValid()) return null;

        // Unpack and simplify any roll parts that are objects (these come from modifiers that affect rolls)
        const formulaParts = [];
        for (const part of parts) {
            if (part instanceof Object) {
                const simplifiedFormula = this._simplifyFormula(part.score || "0", rollContext);
                const explanation = part.explanation ? `[${part.explanation}]` : "";
                formulaParts.push(`${simplifiedFormula}${explanation}`);
            } else {
                formulaParts.push(part);
            }
        }

        // Build the roll formula
        const formula = formulaParts.join(" + ");

        // Get the roll information determined by selections in the roll dialog
        const rollInfo = await RollTree.buildRoll(formula, rollContext, rollCriteria, {
            buttons: game.settings.get("sfrpg", "useAdvantageDisadvantage") ? this.advantageRollButtons : this.normalRollButtons,
            debug: false,
            dialogOptions: dialogOptions,
            skipUI: skipUI && !rollContext.hasMultipleSelectors(),
            title: title
        });

        // Evaluate the roll unless cancelled
        if (rollInfo.button !== "cancel") {

            // Set the main die roll value
            let baseDie = rollCriteria.mainDie;
            if (rollInfo.button === "advantage") baseDie = "2d20kh";
            else if (rollInfo.button === "disadvantage") baseDie = "2d20kl";

            // Create the roll formula, explanation, and roll
            const finalFormula = await this._calcStackingFormula(baseDie, rollInfo, rollContext.allContexts[actorContextKey]?.entity);
            const preparedRollExplanation = DiceSFRPG.formatExplanation(finalFormula.formula);
            const roll = await SFRPGRoll.create(finalFormula.finalRoll, {}, { breakdown: preparedRollExplanation, tags, rollCriteria }).evaluate();

            // Add Critical hit and effect information if required
            if (roll.isCritical) {
                flavor = game.i18n.format("SFRPG.Rolls.Dice.CriticalFlavor", { "title": flavor });
                const criticalData = rollContext.allContexts?.item?.data?.critical;
                if (criticalData?.effect?.trim()) {
                    roll.options.tags.push({ tag: "critical-effect", text: game.i18n.format("SFRPG.Rolls.Dice.CriticalEffect", {"criticalEffect": criticalData.effect })});
                }
            }

            // Roll Evaluation vs Action Target (KAC, EAC, DC, etc.)
            roll.options.rollCriteria.evalValue = DiceSFRPG.getTargetRollEvalValue(roll, rollInfo, rollContext, rollCriteria);
            roll.options.tags.unshift(DiceSFRPG.rollSuccessTag(roll, rollInfo, rollCriteria));

            // Add item roll notes
            const htmlData = [{ name: "rollNotes", value: rollContext.allContexts['item']?.system?.rollNotes }];

            // Create a chat message, applying the appropriate roll type (public, gmroll, etc.)
            if (chatMessage) {
                const messageData = {
                    content: await roll.render({ htmlData: htmlData, customTooltip: finalFormula.rollDices }),
                    flavor,
                    speaker,
                    rolls: [roll],
                    sound: CONFIG.sounds.dice,
                    system: {}
                };
                ChatMessageSFRPG.create(messageData, { rollMode: rollInfo.mode });
            }

            if (onClose) onClose(roll, formula, finalFormula);
            return { roll, finalFormula };

        } else {
            if (onClose) onClose(null, null, null);
            return null;
        }
    }

    /**
    * A standardized helper function for managing Starfinder rolls.
    *
    * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
    * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively (Only available for d20 rolls)
    *
    * Returns a promise that will return an object containing roll and formula.
    *
    * @param {Object}               data                    The parameters passed into the method.
    * @param {RollContext}          data.rollContext        The contextual data for this roll
    * @param {RollCriteria}         data.rollCriteria       Additional data to further define the roll and what it's doing
    * @param {SpeakerData}          data.speaker            The ChatMessage speaker to pass when creating the chat (optional if chatMessage is false)
    * @param {string}               [data.actorContextKey]  Key for evaluating the correct rollContext entry when calculating formulas
    * @param {boolean}              [data.chatMessage]      Whether to create & show a chat message after making the roll
    * @param {DialogOptions}        [data.dialogOptions]    Modal dialog options
    * @param {string}               [data.flavor]           Any flavor text associated with this roll
    * @param {string[]}             [data.parts]            The dice roll component parts, excluding the initial die
    * @param {string}               [data.rollFormula]      The roll formula to use, excluding the initial die. If left empty, will look for parts.
    * @param {boolean}              [data.skipUI]           The triggering event which initiated the roll
    * @param {Tag[]}                [data.tags]             Any roll metadata that will be output on the bottom of the chat card
    * @param {string}               [data.title]            The dice roll UI window title
    * @returns {Promise<RollResult>|Promise<null>}          Returns the roll's result or an empty promise.
    */
    static async createRoll({ rollContext, rollCriteria, speaker,
        actorContextKey = "actor", chatMessage = true, dialogOptions, flavor, parts = [], rollFormula = null, skipUI = false, tags = [], title}) {

        // Verify roll context is valid before continuing
        if (!rollContext?.isValid()) return null;

        // Unpack and simplify any roll parts that are objects (these come from modifiers that affect rolls)
        const formulaParts = [];
        for (const part of parts) {
            if (part instanceof Object) {
                const simplifiedFormula = this._simplifyFormula(part.score || "0", rollContext);
                const explanation = part.explanation ? `[${part.explanation}]` : "";
                formulaParts.push(`${simplifiedFormula}${explanation}`);
            } else {
                formulaParts.push(part);
            }
        }

        // Build the roll formula
        const formula = rollFormula || formulaParts.join(" + ");

        // Get the roll information determined by selections in the roll dialog
        const rollInfo = await RollTree.buildRoll(formula, rollContext, rollCriteria, {
            buttons: game.settings.get("sfrpg", "useAdvantageDisadvantage") && mainDie === "1d20" ? this.advantageRollButtons : this.normalRollButtons,
            debug: false,
            dialogOptions: dialogOptions,
            skipUI: skipUI && !rollContext.hasMultipleSelectors(),
            title: title
        });

        // If cancelled, exit
        if (rollInfo.button !== "cancel") {
            let baseDie = rollCriteria.mainDie;
            if (rollInfo.button === "disadvantage") baseDie = "2d20kl";
            else if (rollInfo.button === "advantage") baseDie = "2d20kh";

            const finalFormula = await this._calcStackingFormula(baseDie, rollInfo, rollContext.allContexts[actorContextKey]?.entity);
            const preparedRollExplanation = DiceSFRPG.formatExplanation(finalFormula.formula);
            const roll = await SFRPGRoll.create(finalFormula.finalRoll, {}, { breakdown: preparedRollExplanation, tags, rollCriteria }).evaluate();

            // Roll Evaluation vs Action Target (KAC, EAC, DC, etc.)
            roll.options.rollCriteria.evalValue = DiceSFRPG.getTargetRollEvalValue(roll, rollInfo, rollContext, rollCriteria);
            roll.options.tags.unshift(DiceSFRPG.rollSuccessTag(roll, rollInfo, rollCriteria));

            // Create a chat message, applying the appropriate roll type (public, gmroll, etc.) and tags
            if (chatMessage) {
                const messageData = {
                    content: await roll.render({ htmlData: htmlData, customTooltip: finalFormula.rollDices }),
                    flavor,
                    speaker,
                    rolls: [roll],
                    sound: CONFIG.sounds.dice,
                    system: {}
                };
                ChatMessageSFRPG.create(messageData, { rollMode: rollInfo.mode });
            }
            return {roll: roll, formula: finalFormula};

        } else {
            return null;
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
    * @param {SFRPGRoll}            linkedAttackRoll   A linked attack roll, passed if damage is automatically rolled with attacks
    * @param {CriticalDamage}       data.criticalData  Critical damage information, in case of a critical hit
    * @param {RollContext}          data.rollContext   The contextual data for this roll
    * @param {String}               data.title         The dice roll UI window title
    * @param {SpeakerData}          data.speaker       The ChatMessage speaker to pass when creating the chat
    * @param {string}               data.flavor        Any flavor text associated with this roll
    * @param {onDamageDialogClosed} data.onClose       Callback for actions to take when the dialog form is closed
    * @param {Object}               data.dialogOptions Modal dialog options
    * @param {String}               data.rollType       Type of roll (options: CONFIG.SFRPG.rollType)
    * @param {Tag[]}                [data.tags]         Any roll metadata that will be output on the bottom of the chat card.
    * @returns {Promise<bool>}                         `true` if roll was performed, `false` if it was canceled
    */
    static async damageRoll({ event = new Event(''), parts, linkedAttackRoll, criticalData, rollContext, title, speaker, flavor, chatMessage = true, onClose, dialogOptions,
        rollType = "damage", tags = []}) {

        // Verify roll context is valid before continuing
        if (!rollContext?.isValid()) return null;

        /** @type {DamageType[]} */
        const damageTypes = parts.reduce((acc, cur) => {
            if (cur.types && !foundry.utils.isEmpty(cur.types)) {
                const filteredTypes = Object.entries(cur.types).filter(type => type[1]);
                const obj = { types: [], operator: "" };

                for (const type of filteredTypes) {
                    obj.types.push(type[0]);
                    if (Object.keys(CONFIG.SFRPG.healingTypes).includes(type[0])) rollType = "healing";
                }

                if (cur.operator) obj.operator = cur.operator;
                if (obj.types.length > 0) acc.push(obj);
            }

            return acc;
        }, []);

        const finalParts = [];
        const damageSections = [];
        for (const part of parts) {
            if (part instanceof Object) {
                if (part.isDamageSection) {
                    damageSections.push(part);

                    const rollInfo = await RollTree.buildRoll(part.formula, rollContext, rollCriteria, {
                        buttons: DiceSFRPG.damageRollButtons,
                        defaultButton: "normal",
                        rollType: rollType,
                        skipUI: true
                    });
                    part.formula = rollInfo.rolls[0].formula.finalRoll;
                } else {
                    const simplifiedFormula = this._simplifyFormula(part.formula || "0", rollContext);
                    const explanation = part.explanation ? `[${part.explanation}]` : "";
                    finalParts.push(`${simplifiedFormula}${explanation}`);
                }
            } else {
                finalParts.push(formula);
            }
        }

        const formula = finalParts.join(" + ");
        const rollInfo = await RollTree.buildRoll(formula, rollContext, {
            buttons: DiceSFRPG.damageRollButtons,
            debug: false,
            defaultButton: "normal",
            dialogOptions: dialogOptions,
            mainDie: "",
            parts: damageSections,
            rollType: rollType,
            skipUI: ((game.settings.get('sfrpg', 'useQuickRollAsDefault')) ? !event?.shiftKey : event?.shiftKey || dialogOptions?.skipUI) && !rollContext.hasMultipleSelectors(),
            title: title
        });

        // Evaluate the roll
        if (rollInfo.button === 'cancel') {
            if (onClose) {
                onClose(null, null, null, false);
            }
        } else for (const { formula: finalFormula, node: part } of rollInfo.rolls) {
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

            // Add item properties, descriptors, and special materials to roll tags
            const itemContext = rollContext.allContexts['item'];
            if (itemContext) {
                // Regular Weapons use data.properties for their properties
                if (itemContext.entity.system.properties) {
                    try {
                        const props = [];
                        for (const [key, propValue] of Object.entries(itemContext.entity.system.properties)) {
                            if (propValue.value) {
                                tags.push({tag: `weapon-properties ${key}`, text: SFRPG.weaponProperties[key]});
                                props.push(key);
                            }
                        }
                        htmlData.push({ name: "weapon-properties", value: JSON.stringify(props) });
                    } catch {
                        // pass
                    }
                }

                // Starship Weapons use data.special for their properties
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
                        } catch {
                            // pass
                        }
                    }
                }

                // Add descriptors
                const descriptors = itemContext.entity.system.descriptors;
                if (descriptors) {
                    for (const [descriptor, isEnabled] of Object.entries(descriptors)) {
                        if (isEnabled) tags.push({tag: descriptor, text: SFRPG.descriptors[descriptor]});
                    }
                }

                // Add special materials
                const specialMaterials = itemContext.entity.system.specialMaterials;
                if (specialMaterials) {
                    for (const [material, isEnabled] of Object.entries(specialMaterials)) {
                        if (isEnabled) tags.push({tag: material, text: SFRPG.specialMaterials[material]});
                    }
                }

                const isMagic = itemContext.data.magic || itemContext.entity.hasMagicDamage;
                if (isMagic) tags.push({tag: 'magic', text: game.i18n.localize("SFRPG.Magic.Magic")});
            }

            // Determine whether the roll should be a critical damage roll
            let isCritical = false;
            if ((game.settings.get('sfrpg', 'useQuickRollAsDefault')) ? !event?.shiftKey : event?.shiftKey || dialogOptions?.skipUI) {
                // if quick roll is selected, determine whether a roll is a critical hit based on the linked attack (if present)
                // if the control key is pressed, roll critical damage regardless
                isCritical = event?.ctrlKey ? true : (linkedAttackRoll ? linkedAttackRoll.isCritical() : false);
            } else if (rollInfo.button === "critical") {
                isCritical = true;
            }

            let finalFlavor = foundry.utils.deepClone(flavor);
            if (isCritical) {
                htmlData.push({ name: "is-critical", value: "true" });
                tags.push({tag: `critical`, text: game.i18n.localize("SFRPG.Rolls.Dice.CriticalHit")});

                if (!criticalData?.preventDoubling) {
                    finalFormula.finalRoll = finalFormula.finalRoll + " + " + finalFormula.finalRoll;
                    finalFormula.formula = finalFormula.formula + " + " + finalFormula.formula;
                }

                if (criticalData !== undefined) {
                    const critRoll = criticalData.parts?.filter(x => x.formula?.trim().length > 0).map(x => x.formula)
                        .join("+") ?? "";
                    if (critRoll.length > 0) {
                        finalFormula.finalRoll = finalFormula.finalRoll + " + " + critRoll;
                        finalFormula.formula = finalFormula.formula + " + " + critRoll;
                    }

                    htmlData.push({ name: "critical-data", value: JSON.stringify(criticalData) });
                }

                finalFlavor = game.i18n.format("SFRPG.Rolls.Dice.CriticalFlavor", { "title": finalFlavor });
            }

            if (part?.name) {
                finalFlavor += `: ${part.name}`;
                if (part.partIndex) {
                    finalFlavor += ` (${part.partIndex})`;
                }
            }

            finalFormula.formula = finalFormula.formula.replace(/\+\s*-\s*/gi, "- ").replace(/\+\s*\+\s*/gi, "+ ")
                .trim();
            finalFormula.formula = finalFormula.formula.endsWith("+") ? finalFormula.formula.substring(0, finalFormula.formula.length - 1).trim() : finalFormula.formula;
            const preparedRollExplanation = DiceSFRPG.formatExplanation(finalFormula.formula);

            const rollObject = SFRPGRoll.create(finalFormula.finalRoll, { tags: tags, breakdown: preparedRollExplanation });
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

            // Associate the damage types for this attack to the first DiceTerm for the roll.
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

            if (chatMessage) {
                const rollContent = await roll.render({ htmlData: htmlData });
                const messageData = {
                    content: rollContent,
                    flavor: finalFlavor,
                    rolls: [roll],
                    sound: CONFIG.sounds.dice,
                    system: {rollType},
                    speaker
                };

                // Insert the damage type string if possible.
                if (damageTypeString?.length > 0) {
                    messageData.content = DiceSFRPG.appendTextToRoll(rollContent, damageTypeString);
                    messageData.system.damage = {
                        amount: roll.total,
                        types: damageTypeString?.replace(' & ', ',')?.toLowerCase() ?? ""
                    };
                }

                // Add special materials, descriptors, and magic status to chat message system data (to overcome DR)
                if (itemContext) {
                    if (itemContext.entity.system.specialMaterials) {
                        messageData.system.specialMaterials = itemContext.entity.system.specialMaterials;
                    }

                    if (itemContext.entity.system.descriptors) {
                        messageData.system.descriptors = itemContext.entity.system.descriptors;
                    }

                    messageData.system.hasMagicDamage = {value: (itemContext.data.magic || itemContext.entity.hasMagicDamage) ? true : false};
                }

                ChatMessageSFRPG.create(messageData, { rollMode: rollInfo.mode });
            }

            if (onClose) {
                onClose(roll, formula, finalFormula, isCritical);
            }
        }

        return rollInfo.button !== 'cancel';
    }

    static appendTextToRoll(originalRollHTML, textToAppend) {
        const diceRollHtml = '<h3 class="dice-total">';

        const diceRollIndex = originalRollHTML.indexOf(diceRollHtml);
        const firstHalf = originalRollHTML.substring(0, diceRollIndex + diceRollHtml.length);
        const splitOffFirstHalf = originalRollHTML.substring(diceRollIndex + diceRollHtml.length);

        const closeTagIndex = splitOffFirstHalf.indexOf('</h3>');
        const rollResultHtml = splitOffFirstHalf.substring(0, closeTagIndex);
        const secondHalf = splitOffFirstHalf.substring(closeTagIndex);

        const combinedResult = firstHalf + rollResultHtml + ` ${textToAppend}` + secondHalf;
        return combinedResult;
    }

    /**
     * Hightlight rolls that are considered critical successes or failures.
     *
     * @param {ChatMessageSFRPG} message       The ChatMessage document being rendered
     * @param {JQuery}      html               The pending HTML as a jQuery object
     */
    static highlightCriticalSuccessFailure(message, html) {
        if (!message.isRoll || !message.isContentVisible) return;

        const roll = message.rolls[0];
        if (!roll.dice.length) return;
        if (roll.isCritical) {
            html.find('.dice-total').addClass('success');
        }
        if (roll.isFumble) {
            html.find('.dice-total').addClass('failure');
        }
    }

    /**
     * Add damage types for damage rolls to the chat card.
     *
     * @param {ChatMessageSFRPG} message       The ChatMessage document being rendered
     * @param {JQuery}      html               The pending HTML as a jQuery object
     */
    static addDamageTypes(message, html) {
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

    static formatExplanation(explanationText) {
        let index = 0;
        let consumedText = "";
        let isReading = false;
        const sections = [];
        while (index < explanationText.length) {
            const token = explanationText[index++];
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
        finalResult = (finalResult[0] === '-') ? finalResult : '+ ' + finalResult;
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

        const rollInfo = RollTree.buildRollSync(sourceFormula, rollContext, {rollType: "roll"});
        const finalFormula = rollInfo.rolls[0].formula;
        try {
            const formula = SFRPGRoll.replaceFormulaData(finalFormula.finalRoll, null);
            resultValue = Roll.safeEval(formula);
            resolveResult.evaluatedFormula = formula;
        } catch (error) {
            if (options?.logErrors) {
                console.error(['Failed to evaluate diceless formula, are there dice terms in there?', sourceFormula, rollContext, finalFormula.finalRoll, error]);
            }
            resolveResult.hadError = true;
        }

        if (!resolveResult.hadError) {
            try {
                const finalNumber = Roll.safeEval(resultValue);
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
     * Gets the value that the roll total should be evaluated against
     * @param   {SFRPGRoll}     roll            roll to evaluate
     * @param   {RollInfo}      rollInfo        output from buildRoll, including dialog selections
     * @param   {RollContext}   rollContext     the context under which to evaluate to roll
     * @param   {RollCriteria}  rollCriteria    additional options to be stored with the roll
     */
    static getTargetRollEvalValue(roll, rollInfo, rollContext, rollCriteria) {
        const actionTarget = rollCriteria.actionTarget;
        const difficulty = rollCriteria.difficulty;
        const targetActorType = rollInfo.target?.actorType;
        const targetQuadrant = rollInfo.target?.quadrant ?? "";
        const validTargets = targetActorType === "starship" ? Object.keys(CONFIG.SFRPG.actionTargetsStarship) : Object.keys(CONFIG.SFRPG.actionTargets);

        if (typeof roll.total === "number") {
            if (difficulty) {
                return difficulty;
            } else if (rollContext.allContexts.target && validTargets.includes(actionTarget)) {
                const targetData = rollContext.allContexts.target.data;
                const evalValue = foundry.utils.getProperty(targetData, CONFIG.SFRPG.actionTargetPaths[actionTarget]);
                switch (actionTarget) {
                    case "":
                        return null;
                    case "other":
                        return null;
                    case "ac5":
                        return 5;
                    case "ac15":
                        return 15;
                    case "kac8":
                        if (evalValue) {
                            return evalValue;
                        } else if (foundry.utils.getProperty(targetData, CONFIG.SFRPG.actionTargetPaths["kac"])) {
                            return foundry.utils.getProperty(targetData, CONFIG.SFRPG.actionTargetPaths["kac"]) + 8;
                        } else {
                            return null;
                        }
                    case "ac":
                        if (targetQuadrant) {
                            return foundry.utils.getProperty(targetData, `quadrants.${targetQuadrant}.ac.value`);
                        } else {
                            return null;
                        }
                    case "tl":
                        if (targetQuadrant) {
                            return foundry.utils.getProperty(targetData, `quadrants.${targetQuadrant}.targetLock.value`);
                        } else {
                            return null;
                        }
                    default:
                        return evalValue;
                }
            }
        }
        return null;
    }

    /**
     * Generates the success/failure message based on the roll value, type, and target stats
     * @param   {SFRPGRoll}     roll            the roll object
     * @param   {RollInfo}      rollInfo        output from buildRoll, including dialog selections
     * @param   {RollCriteria}  rollCriteria     additional options to be stored with the roll
     * @returns {Tag}                           the generated tag that indicates success/failure
     */
    static rollSuccessTag(roll, rollInfo, rollCriteria) {
        let prependedQuadrantInfo = "";
        if (rollInfo.target.actorType === "starship" && rollInfo.target.quadrant) {
            prependedQuadrantInfo = `${rollInfo.target.quadrantName} `;
        }

        const evalValue = roll.evalValue;
        const rollSuccess = roll.product;
        const rollType = rollCriteria.rollType;
        const difficulty = rollCriteria.difficulty;

        const rollIsAttack = rollType === "attack" || rollType === "gunnery";
        const criticalSuccessLocalized = rollIsAttack ? game.i18n.format("SFRPG.Rolls.CriticalHitCaps") : game.i18n.format("SFRPG.Rolls.CriticalSuccessCaps");
        const successLocalized = rollIsAttack ? game.i18n.format("SFRPG.Rolls.HitCaps") : game.i18n.format("SFRPG.Rolls.SuccessCaps");
        const failureLocalized = rollIsAttack ? game.i18n.format("SFRPG.Rolls.MissCaps") : game.i18n.format("SFRPG.Rolls.FailureCaps");
        const fumbleLocalized = game.i18n.format("SFRPG.Rolls.FumbleCaps");

        if (rollCriteria?.actionTarget) {
            const actionTargetSource = rollCriteria.actionTargetSource[rollCriteria.actionTarget];
            if (rollSuccess !== null) {
                const actionTarget = `${prependedQuadrantInfo}${actionTargetSource}`;
                let actionResult = "";
                if (roll.isCritical) {
                    actionResult = `<span class="success">${criticalSuccessLocalized}</span>`;
                } else if (roll.isFumble) {
                    actionResult = `<span class="fail">${fumbleLocalized}</span>`;
                } else {
                    actionResult = `<span class="${rollSuccess ? "success" : "fail"}">${rollSuccess ? successLocalized : failureLocalized}</span>`;
                }
                return { name: "actionTarget", text: game.i18n.format("SFRPG.Items.Action.ActionTarget.TagFull", {actionTarget, targetValue: evalValue, actionResult}) };
            } else {
                const actionTarget = `${prependedQuadrantInfo}${actionTargetSource}`;
                return { name: "actionTarget", text: game.i18n.format("SFRPG.Items.Action.ActionTarget.Tag", {actionTarget} ) };
            }
        } else if (difficulty) {
            const actionTarget = game.i18n.format("SFRPG.DC");
            let actionResult = "";
            if (roll.isCritical) {
                actionResult = `<span class="success">${criticalSuccessLocalized}</span>`;
            } else if (roll.isFumble) {
                actionResult = `<span class="fail">${fumbleLocalized}</span>`;
            } else {
                actionResult = `<span class="${rollSuccess ? "success" : "fail"}">${rollSuccess ? successLocalized : failureLocalized}</span>`;
            }
            return { name: "actionTarget", text: game.i18n.format("SFRPG.Items.Action.ActionTarget.TagFull", {actionTarget, targetValue: evalValue, actionResult}) };
        }
    }

    /**
     * returns the rootNode with removed childnodes that match the modifier.
     * @param {RollNode}        rootNode
     * @param {SFRPGModifier}   modifier
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
     * @param {String}          baseDie     the base die used in the roll (string representation)
     * @param {RollInfo}        rollInfo    output from buildRoll, including dialog selections
     * @param {ActorSFRPG}      actor       the actor making the roll
     * @returns {ResolvedRoll}
     */
    static async _calcStackingFormula(baseDie = null, rollInfo, actor = null) {
        const node = rollInfo.rolls[0].node;
        const rollMods = rollInfo.modifiers;
        const bonus = rollInfo.bonus ?? '';
        const enabledRollMods = rollMods.filter(mod => mod.enabled);

        // Remove modifier nodes that already exist so they aren't double-counted
        let rootNode = node;
        for (const mod of enabledRollMods) rootNode = this._removeModifierNodes(rootNode, mod);

        // Stack modifiers, removing multiples with the same type
        const stackedRollMods = await new StackModifiers().processAsync(enabledRollMods, null, { actor: actor });

        // Account for situational roll modifiers in the roll formula & explanation
        const rollModFormulaParts = [];
        const rollModExplanationParts = [];
        const rollModDice = [];
        for (const modifiers of Object.values(stackedRollMods)) {
            for (const modifier of modifiers) {
                rollModFormulaParts.push(modifier.max);

                if (modifier.isDeterministic) {
                    rollModExplanationParts.push(`${modifier.max} [<span>${modifier.name}</span>]`);
                } else {
                    rollModExplanationParts.push(`${modifier.max}(${modifier.modifier}) [<span>${modifier.name}</span>]`);
                    rollModDice.push(...modifier.dices);
                }
                /*
                TODO: add title to the span, e.g.:
                title="${game.i18n.format(localizationKey, type: modifier.type.capitalize(),mod: modifier.max.signedString(),source: modifier.name)}"
                but in order to do that we will need the localization key for the current modifier which we do not have at this point. Maybe we will have to pass it down from the modifier calculation lol.
                */
            }
        }

        // Add the situational bonus if present
        if (bonus) {
            rollModFormulaParts.push(bonus);
            rollModExplanationParts.push(`${bonus} [<span>${game.i18n.localize("SFRPG.Rolls.Dialog.SituationalBonus")}</span>]`);
        }

        // Generate the unmodified formula object to return
        const finalFormula = rootNode.resolveForRoll(rollMods);

        // Set the dice, formula string (finalRoll), and explanation string (formula) on the object to be returned
        finalFormula.rollDices = rollModDice;
        finalFormula.finalRoll = [baseDie ?? '', finalFormula.finalRoll, ...rollModFormulaParts]
            .join(" + ")
            .replace(/\+\s*-\s*/gi, "- ")
            .replace(/\+\s*\+\s*/gi, "+ ");
        finalFormula.formula = [finalFormula.formula, ...rollModExplanationParts]
            .join(" + ")
            .replace(/\+\s*-\s*/gi, "- ")
            .replace(/\+\s*\+\s*/gi, "+ ");

        return finalFormula;
    }

    /**
     * Simplifies a formula using a roll context
     * @param {string} formula The formula you want to simplify
     * @param {RollContext} rollContext The roll context to use
     * @returns {string} A simplified version of the formula
     */
    static _simplifyFormula(formula, rollContext) {
        try {
            return SFRPGRoll.create(formula, rollContext.getRollData()).simplifiedFormula;
        } catch {
            return formula;
        }
    }

    /**
     * The below is copied from the DnD5e system on Foundry (https://github.com/foundryvtt/dnd5e/blob/master/module/dice/simplify-roll-formula.mjs) under the MIT License.
     * Copyright 2021 Andrew Clayton
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
        try { roll = SFRPGRoll.create(formula); } catch (err) { console.warn(`Unable to simplify formula '${formula}': ${err}`); }
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
