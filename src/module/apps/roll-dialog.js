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
     * @param {String} params.rollType The type of roll being made
     * @param {DialogOptions} [params.options] Any additional options being passed to the dialog.
     */
    constructor({ rollTree, formula, contexts, availableModifiers, mainDie, parts = [], dialogData = {}, rollType = "roll", options = {} }) {
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
                // Coerce undefined to null
                const itemGroup = item.group ?? null;
                const group = (groups[itemGroup] || []);
                group.push(item);
                groups[itemGroup] = group;
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

        /** Prepare Target */
        this.targetQuadrant = "";
        if (contexts.allContexts.target) {
            this.hasTarget = true;
            this.target = contexts.allContexts.target;
        } else {
            this.hasTarget = false;
            this.target = null;
        }

        /** Set roll type */
        this.rollType = rollType;

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

    async getData() {
        const data = await super.getData();
        data.formula = this.formula;
        data.rollMode = this.rollMode;
        data.additionalBonus = this.additionalBonus;
        data.availableModifiers = foundry.utils.deepClone(this.availableModifiers) || [];
        data.hasModifiers = data.availableModifiers.length > 0;
        data.hasSelectors = this.contexts.selectors && this.contexts.selectors.length > 0;
        data.selectors = this.selectors;
        data.contexts = this.contexts;
        data.rollType = this.rollType;
        data.hasTarget = this.hasTarget;
        data.target = this.target;
        data.targetQuadrant = this.targetQuadrant;
        data.targetOwner = this.target?.entity?.isOwner ?? null;
        data.damageGroups = this.damageGroups;

        for (const modifier of data.availableModifiers) {
            if (Object.keys(CONFIG.SFRPG.modifierTypes).includes(modifier.type)) {
                modifier.localizedType = game.i18n.localize(`${CONFIG.SFRPG.modifierTypes[modifier.type]}`);
            }
        }

        if (this.parts?.length > 0) {
            data.hasDamageTypes = true;

            if (this.parts[0].enabled === undefined) {
                this.parts[0].enabled = true;
            }

            for (const [partIndex, part] of this.parts.entries()) {
                // If there is no name, create the placeholder name
                if (!part.name && this.parts.length > 1) {
                    part.name = game.i18n.format("SFRPG.Items.Action.DamageSection", {section: partIndex});
                }

                // Create type string out of localized parts
                let typeString = "";
                if (part.types && !foundry.utils.isEmpty(part.types)) {
                    typeString = Object.entries(part.types)
                        .filter(([, value]) => value)
                        .map(([key]) => SFRPG.damageTypes[key])
                        .join(" & ");
                }
                part.type = typeString;

                /* If it actually was simplified, append the original modififer for use on the tooltip.
                *
                * If the formulas are different with whitespace, that means the original likely has some weird whitespace, so let's correct that, bu we don't need to tell the user.
                */
                const simplerRoll = Roll.create(part.formula).simplifiedFormula;
                if (part.formula !== simplerRoll) {
                    part.originalFormula = part.formula;
                    part.formula = simplerRoll;

                    // If the formulas are still different without whitespace, then FunctionTerms must have been simplifed, so let's tell the user.
                    if (part.originalFormula.replace(/\s/g, "") !== simplerRoll.replace(/\s/g, "")) {
                        part.originalFormulaTooltip = true;
                    }
                }
            }

            data.formula = [
                (this.parts.length === 1) ? this.parts[0].formula : '<Primary Section>',
                this.formula
            ].filter(Boolean).join(' + ') || '0';
        }

        if (this.hasTarget) {
            data.targetTooltip = "";
            switch (this.target.entity.actor.type) {
                case "character":
                    data.targetTooltip = `<strong>EAC:</strong> ${this.target.data.attributes.eac.value}<br/><strong>KAC:</strong> ${this.target.data.attributes.kac.value}<br/><strong>KAC+8:</strong> ${this.target.data.attributes.cmd.value}`;
                    break;
                case "npc2":
                    data.targetTooltip = `<strong>EAC:</strong> ${this.target.data.attributes.eac.value}<br/><strong>KAC:</strong> ${this.target.data.attributes.kac.value}`;
                    break;
                case "drone":
                    data.targetTooltip = `<strong>EAC:</strong> ${this.target.data.attributes.eac.value}<br/><strong>KAC:</strong> ${this.target.data.attributes.kac.value}<br/><strong>KAC+8:</strong> ${this.target.data.attributes.cmd.value}`;
                    break;
                case "starship":
                    data.targetTooltip = `<strong>Forward AC:</strong> ${this.target.data.quadrants.forward.ac.value}<br/><strong>Port AC:</strong> ${this.target.data.quadrants.port.ac.value}<br/><strong>Starboard AC:</strong> ${this.target.data.quadrants.starboard.ac.value}<br/><strong>Aft AC:</strong> ${this.target.data.quadrants.aft.ac.value}`;
                    break;
                case "vehicle":
                    data.targetTooltip = `<strong>EAC:</strong> ${this.target.data.attributes.eac.value}<br/><strong>KAC:</strong> ${this.target.data.attributes.kac.value}`;
                    break;
                case "hazard":
                    data.targetTooltip = `<strong>EAC:</strong> ${this.target.data.attributes.eac.value}<br/><strong>KAC:</strong> ${this.target.data.attributes.kac.value}`;
                    break;
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
        additionalBonusTextbox.on('keyup', this._onAdditionalBonusChanged.bind(this));

        const rollModeCombobox = html.find('select[name=rollMode]');
        rollModeCombobox.on('change', this._onRollModeChanged.bind(this));

        const modifierEnabled = html.find('.toggle-modifier');
        modifierEnabled.on('click', this._toggleModifierEnabled.bind(this));

        const selectorCombobox = html.find('.selector');
        selectorCombobox.on('change', this._onSelectorChanged.bind(this));

        const targetQuadrantSelector = html.find('.quadrant-select');
        targetQuadrantSelector.on('change', this._onTargetQuadrantSelect.bind(this));

        html.find("div.target.owned").on("click", (event) => this._onTargetClick(event));

        html.find('input[class="damageSection"][type="radio"]').on('change', this._onDamageSectionRadio.bind(this)); // Handle radios turning each other off
        html.find('input[class="damageSection"][type="checkbox"]').on('change', this._onDamageSectionCheckbox.bind(this));
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
    }

    async _onSelectorChanged(event) {
        const selectorName = event.target.name;
        const selectedValue = event.target.value;

        this.selectors[selectorName].value = selectedValue;
        this.contexts.allContexts[selectorName] = this.contexts.allContexts[selectedValue];

        /** Repopulate nodes, might change modifiers because of different selector. */
        this.rollTree.populate(this.contexts);
        this.availableModifiers = this.rollTree.getRolledModifiers();

        this.position.height = "auto";
        this.render(false);
    }

    async _onTargetClick(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.targetId;
        const actor = game.scenes.current.tokens.get(id).actor;

        actor.sheet.render(true);
    }

    async _onTargetQuadrantSelect(event) {
        this.targetQuadrant = event.target.value;
    }

    _onDamageSectionRadio(event) {
        const damageGroups = this.damageGroups;

        const selectorGroup = event.currentTarget.name;
        const selectorId = event.currentTarget.id;

        const selectedGroup = damageGroups[selectorGroup];

        selectedGroup.forEach(i => i.enabled = false);
        selectedGroup[selectorId].enabled = event.currentTarget.checked;

        // this.render(null, false);
    }

    _onDamageSectionCheckbox(event) {
        const damageGroups = this.damageGroups;

        const selectorGroup = event.currentTarget.name;
        const selectorId = event.currentTarget.id;

        const selectedGroup = damageGroups[selectorGroup];

        selectedGroup[selectorId].enabled = event.currentTarget.checked;
    }

    submit(button) {
        try {
            this.rolledButton = button?.id ?? button?.label ?? "normal";
            this.close();
        } catch (err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    async close(options) {
        /** Fire callback, then delete, as it would get called again by Dialog#close. */
        if (this.data.close) {
            this.data.close(this.rolledButton, this.rollMode, this.additionalBonus, this.parts, this.targetQuadrant);
            delete this.data.close;
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
     * @param {DialogOptions} options.dialogOptions
     * @param {String} options.rollType             The type of roll
     * @returns {Promise<{button: string, rollMode: string, bonus: string, parts: DamagePart[]}>}
     */
    static showRollDialog(rollTree, formula, contexts, availableModifiers = [], mainDie, options = {}) {
        return new Promise(resolve => {
            const buttons = options.buttons || { roll: { id: "roll", label: game.i18n.localize("SFRPG.Rolls.Dice.Roll") } };
            const defaultButton = options.defaultButton || (Object.values(buttons)[0].id ?? Object.values(buttons)[0].label);

            const dlg = new RollDialog({
                availableModifiers,
                contexts,
                dialogData: {
                    title: options.title || game.i18n.localize("SFRPG.Rolls.Dice.Roll"),
                    buttons: buttons,
                    default: defaultButton,
                    close: (button, rollMode, bonus, parts, targetQuadrant) => {
                        resolve({button, rollMode, bonus: bonus?.trim(), parts, targetQuadrant});
                    }
                },
                formula,
                mainDie,
                parts: options.parts,
                rollTree,
                rollType: options.rollType,
                options: options.dialogOptions || {}
            });
            dlg.render(true);
        });
    }
}
