import { SFRPG } from "../config.js";

// Typedef's for documentation purposes.
/**
 * A data structure for storing damage statistics.
 *
 * @typedef {Object} DamagePart
 * @property {string}                     formula  The roll formula to use.
 * @property {{[key: string]: boolean}}   types    A set of key value pairs that determines the available damage types.
 * @property {string}                     operator An operator that determines how damage is split between multiple types.
 */

/**
 * A custom dialog for confirming rolls from a user.
 */
export default class RollDialog extends Dialog {
    /**
     * Construct a custom RollDialog
     *
     * @param {object} params The parameters passed into the class.
     * @param {RollTree} params.rollTree
     * @param {string} params.formula The formula used for this roll.
     * @param {RollContext} params.contexts Contextual data for the roll.
     * @param {Modifier[]} params.availableModifiers Any conditional modifiers that can apply to this roll.
     * @param {string} params.mainDie The primary die type used in this roll.
     * @param {DamagePart[]} [params.parts] An array of DamageParts.
     * @param {Object} [params.dialogData] Any additional data being passed to the dialog.
     * @param {DialogOptions} [params.options] Any additional options being passed to the dialog.
     */
    constructor({ rollTree, formula, contexts, availableModifiers, mainDie, parts = [], dialogData = {}, options = {} }) {
        super(dialogData, options);

        this.rollTree = rollTree;
        this.formula = formula;
        this.contexts = contexts;
        this.availableModifiers = availableModifiers;
        if (mainDie) {
            this.formula = mainDie + " + " + formula;
        }

        this.parts = parts;

        // Sort parts by group. Parts with the same group will share a radio input.
        if (this.parts.length > 0) {
            this.damageGroups = this.parts.reduce((groups, item) => {
                const group = (groups[item.group] || []);
                group.push(item);
                groups[item.group] = group;
                return groups;
            }, {});
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
        return "systems/sfrpg/templates/chat/roll-dialog.hbs";
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sfrpg", "dialog", "roll"],
            width: 540
        });
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

    async getData() {
        const data = await super.getData();
        data.formula = this.formula;
        data.rollMode = this.rollMode;
        data.rollModes = CONFIG.Dice.rollModes;
        data.additionalBonus = this.additionalBonus;
        data.availableModifiers = duplicate(this.availableModifiers) || [];
        data.hasModifiers = data.availableModifiers.length > 0;
        data.hasSelectors = this.contexts.selectors && this.contexts.selectors.length > 0;
        data.selectors = this.selectors;
        data.contexts = this.contexts;
        data.damageGroups = this.damageGroups;

        for (const modifier of data.availableModifiers) {
            const allContexts = data.contexts.allContexts;
            const mainContext = data.contexts.mainContext;
            let context = allContexts[mainContext]?.data;

            // Starships use "@ship" etc. in their formulas, so the context needs to be adjusted to skip the intermediate "data/entity" object.
            if (["ship", ""].includes(mainContext)) {
                context = Object.entries(allContexts).reduce((obj, i) => {
                    const scope = i[0];
                    const data = i[1].data;
                    obj[scope] = data;
                    return obj;
                }, {});
            }

            // Make a simplified roll
            const simplerRoll = Roll.create(modifier.modifier, context).simplifiedFormula;
            if (modifier.modifier[0] === "+") modifier.modifier = modifier.modifier.slice(1);

            // If it actually was simplified, append the original modififer for use on the tooltip.
            if (modifier.modifier !== simplerRoll) {
                modifier.originalFormula = modifier.modifier;
            }

            // Sign that string
            const numMod = Number(simplerRoll);
            modifier.modifier = numMod ? numMod.signedString() : simplerRoll;

            if (Object.keys(CONFIG.SFRPG.modifierTypes).includes(modifier.type)) {
                modifier.localizedType = game.i18n.localize(`${CONFIG.SFRPG.modifierTypes[modifier.type]}`);
            }
        }

        if (this.parts?.length > 0) {
            data.hasDamageTypes = true;

            for (const part of this.parts) {
                const partIndex = this.parts.indexOf(part);

                // If there is no name, create the placeholder name
                if (!part.name && this.parts.length > 1) {
                    part.name = game.i18n.format("SFRPG.Items.Action.DamageSection", {section: partIndex});
                }

                if (partIndex === 0 && part.enabled === undefined) {
                    part.enabled = true;
                }

                // Create type string out of localized parts
                let typeString = "";
                if (part.types && !foundry.utils.isEmpty(part.types)) {
                    typeString = `${(Object.entries(part.types).filter(type => type[1])
                        .map(type => SFRPG.damageTypes[type[0]])
                        .join(` & `))}`;
                }
                part.type = typeString;

                // Clean up the formula
                const simplerRoll = Roll.create(part.formula).simplifiedFormula;
                if (part.formula !== simplerRoll) {
                    part.originalFormula = part.formula;
                    part.formula = simplerRoll;
                }
            }

            data.formula = this.formula;
            if (this.parts?.length === 1) {
                data.formula = this.formula.replace("<damageSection>", this.parts[0].formula);
            }
        }

        return data;
    }

    /**
     * Activate any event listeners.
     *
     * @param {JQuery} html The jQuery object that represents the HTMl content.
     */
    activateListeners(html) {
        super.activateListeners(html);

        const additionalBonusTextbox = html.find('input[name=bonus]');
        additionalBonusTextbox.on('change', this._onAdditionalBonusChanged.bind(this));

        const rollModeCombobox = html.find('select[name=rollMode]');
        rollModeCombobox.on('change', this._onRollModeChanged.bind(this));

        const modifierEnabled = html.find('.toggle-modifier');
        modifierEnabled.on('click', this._toggleModifierEnabled.bind(this));

        const selectorCombobox = html.find('.selector');
        selectorCombobox.on('change', this._onSelectorChanged.bind(this));

        html.find('input[class="damageSection"][type="radio"]').on('change', this._onDamageSectionRadio.bind(this)); // Handle radios turning each other off
        html.find('input[class="damageSection"][type="checkbox"]').on('change', this._onDamageSectionCheckbox.bind(this));
    }

    async _onAdditionalBonusChanged(event) {
        this.additionalBonus = event.target.value;
    }

    async _onRollModeChanged(event) {
        this.rollMode = event.target.value;
    }

    _getActorForContainer(container) {
        if (container.tokenId) {
            const scene = game.scenes.get(container.sceneId);
            const token = scene.tokens.get(container.tokenId);
            return token.actor;
        }
        return game.actors.get(container.actorId);
    }

    async _toggleModifierEnabled(event) {
        const modifierIndex = $(event.currentTarget).data('modifierIndex');
        const modifier = this.availableModifiers[modifierIndex];

        modifier.enabled = !modifier.enabled;
        this.render(false);

        if (modifier._id) {
            // Update container
            const container = modifier.container;
            const actor = this._getActorForContainer(container);
            if (container.itemId) {
                const item = container.itemId ? await actor.items.get(container.itemId) : null;

                // Update modifier by ID in item
                const containerModifiers = duplicate(item.system.modifiers);
                const modifierToUpdate = containerModifiers.find(x => x._id === modifier._id);
                modifierToUpdate.enabled = modifier.enabled;
                await item.update({ "system.modifiers": containerModifiers });
            } else {
                // Update modifier by ID in actor
                const containerModifiers = duplicate(actor.system.modifiers);
                const modifierToUpdate = containerModifiers.find(x => x._id === modifier._id);
                modifierToUpdate.enabled = modifier.enabled;
                await actor.update({ "system.modifiers": containerModifiers });
            }
        }
    }

    async _onSelectorChanged(event) {
        const selectorName = event.target.name;
        const selectedValue = event.target.value;

        this.selectors[selectorName].value = selectedValue;
        this.contexts.allContexts[selectorName] = this.contexts.allContexts[selectedValue];

        /** Repopulate nodes, might change modifiers because of different selector. */
        this.availableModifiers = await this.rollTree.populate();

        this.position.height = "auto";
        this.render(false);
    }

    _onDamageSectionRadio(event) {
        let damageGroups = this.damageGroups;

        const selectorGroup = event.currentTarget.name;
        const selectorId = event.currentTarget.id;

        const selectedGroup = damageGroups[selectorGroup];

        selectedGroup.forEach(i => i.enabled = false);
        selectedGroup[selectorId].enabled = event.currentTarget.checked;

        // this.render(null, false);
    }

    _onDamageSectionCheckbox(event) {
        let damageGroups = this.damageGroups;

        const selectorGroup = event.currentTarget.name;
        const selectorId = event.currentTarget.id;

        const selectedGroup = damageGroups[selectorGroup];

        selectedGroup[selectorId].enabled = event.currentTarget.checked;
    }

    submit(button) {
        try {
            this.rolledButton = button.id ?? button.label;
            this.close();
        } catch (err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    async close(options) {
        /** Fire callback, then delete, as it would get called again by Dialog#close. */
        if (this.data.close) {
            this.data.close(this.rolledButton, this.rollMode, this.additionalBonus, this.parts);
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

    /**
     * Factory method used to create a RollDialog.
     *
     * @param {RollTree} rollTree
     * @param {string} formula
     * @param {RollContext} contexts
     * @param {Modifier[]} availableModifiers
     * @param {string} mainDie
     * @param {DialogOptions} options
     * @returns {RollDialog}
     */
    static async showRollDialog(rollTree, formula, contexts, availableModifiers = [], mainDie, options = {}) {
        return new Promise(resolve => {
            const buttons = options.buttons || { roll: { id: "roll", label: game.i18n.localize("SFRPG.Rolls.Dice.Roll") } };
            const defaultButton = options.defaultButton || (Object.values(buttons)[0].id ?? Object.values(buttons)[0].label);

            const dlg = new RollDialog({
                rollTree,
                formula,
                contexts,
                availableModifiers,
                mainDie,
                parts: options.parts,
                dialogData: {
                    title: options.title || game.i18n.localize("SFRPG.Rolls.Dice.Roll"),
                    buttons: buttons,
                    default: defaultButton,
                    close: (button, rollMode, bonus, parts) => {
                        resolve([button, rollMode, bonus, parts]);
                    }
                },
                options: options.dialogOptions || {}
            });
            dlg.render(true);
        });
    }
}
