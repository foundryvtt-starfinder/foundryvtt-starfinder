
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
            let d20 = roll.terms[0];
            d20.options.critical = critical;
            d20.options.fumble = fumble;

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
    static damageRoll({ event = new Event(''), parts, criticalData, actor, data, template, title, speaker, flavor, critical = true, onClose, dialogOptions }) {
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

            let roll = new Roll(parts.join("+"), data);
            if (crit === true) {
                let add = /*(actor && actor.getFlag("dnd5e", "savageAttacks")) ? 1 :*/ 0;
                let mult = 2;
                roll.alter(add, mult);
                flavor = `${title} (Critical)`;

                if (criticalData !== undefined) {
                    flavor = `${title} (Critical; ${criticalData.effect})`;

                    let critRoll = criticalData.parts.filter(x => x[0].length > 0).map(x => x[0]).join("+");
                    if (critRoll.length > 0) {
                        let finalRoll = Roll.cleanFormula(roll.formula + " + " + critRoll);

                        roll = new Roll(finalRoll, data);
                    }
                }
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
        let matches = formula.match(new RegExp(/@[a-z.0-9]+/gi))?.map(x => x.replace('@', '')) ?? [];

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
}

export const highlightCriticalSuccessFailure = function (message, html, data) {
    if (!message.isRoll || !message.isContentVisible) return;

    let roll = message.roll;
    if (!roll.dice.length) return;
    let d = roll.dice[0];
    if (d instanceof Die && (d.faces === 20) && (d.results.length === 1)) {
        if (d.total >= (d.options.critical || 20)) html.find('.dice-total').addClass('success');
        else if (d.total <= (d.options.fumble || 1)) html.find('.dice-total').addClass('failure');
    }
};
