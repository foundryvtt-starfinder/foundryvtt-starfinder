import { StarfinderModifierTypes, StarfinderModifierType, StarfinderEffectType } from "../modifiers/types.js";

/**
 * Application that is used to edit a dynamic modifier.
 * 
 * @param {Object} modifier The modifier being edited.
 * @param {Object} acotr    The actor that the modifier belongs to.
 * @param {Object} options  Any options that modify the rendering of the sheet.
 */
export default class StarfinderModifierApplication extends FormApplication {
    constructor(modifier, actor, options={}) {
        super(modifier, options);

        this.actor = actor;
    }

    static get defaultOptions() {
        let options = super.defaultOptions;

        return mergeObject(options, {
            id: 'modifier-app',
            classes: ['starfinder', 'modifier-app'],
            template: "systems/starfinder/templates/apps/modifier-app.html",
            width: 400,
            height: 'auto',
            closeOnSubmit: true
        });
    }

    /** @override */
    get title() {
        return game.i18n.format("STARFINDER.ModifierAppTitle", {name: this.modifier.name});
    }

    /**
     * A convience method for retrieving the modifier being edited.
     */
    get modifier() {
        return this.object;
    }

    /**
     * @override
     */
    getData() {
        const data = {
            owner: this.actor.owner,
            modifier: this.modifier,
            limited: this.actor.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: this.actor.owner ? "editable": "locked",
            config: CONFIG.STARFINDER
        };

        return data;
    }

    /**
     * @override
     * @param {jQuery} html The jQuery object that represents the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.modifier-effect-type select').change(event => {
            const current = $(event.currentTarget);
            const target = $('.modifier-value-affected select');
            const effectType = current.val();

            switch (effectType) {
                case StarfinderEffectType.ABILITY_SKILLS:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const ability of Object.entries(CONFIG.STARFINDER.abilities)) {
                        target.append(`<option value="${ability[0]}">${ability[1]}</option>`);
                    }
                    break;
                case StarfinderEffectType.AC:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const armorClass of Object.entries(CONFIG.STARFINDER.modifierArmorClassAffectedValues)) {
                        target.append(`<option value="${armorClass[0]}">${armorClass[1]}</option>`)
                    }
                    break;
                case StarfinderEffectType.ACP:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const acp of Object.entries(CONFIG.STARFINDER.acpEffectingArmorType)) {
                        target.append(`<option value="${acp[0]}">${acp[1]}</option>`);
                    }
                    break;
                case StarfinderEffectType.SAVE:
                    target.prop('disabled', false);
                    target.find('option').remove();

                    target.append(`<option value="highest">${game.i18n.localize("STARFINDER.ModifierSaveHighest")}</option>`);
                    target.append(`<option value="lowest">${game.i18n.localize("STARFINDER.ModifierSaveLowest")}</option>`);
                    for (const saves of Object.entries(CONFIG.STARFINDER.saves)) {
                        target.append(`<option value="${saves[0]}">${saves[1]}</option>`);
                    }
                    break;
                case StarfinderEffectType.SKILL:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const skills of Object.entries(CONFIG.STARFINDER.skills)) {
                        target.append(`<option value="${skills[0]}">${skills[1]}</option>`);
                    }
                    break;
                default:
                    target.prop('disabled', true);
                    target.find('option').remove();
                    target.append('<option value=""></option>');
                    break;
            }
        });
    }

    /** @override */
    async _render(...args) {
        await super._render(...args);

        const effectType = this.element.find('.modifier-effect-type select').val();
        const valueAffectedElement = this.element.find('.modifier-value-affected select');
        
        switch (effectType) {
            case StarfinderEffectType.ABILITY_SKILLS:
                valueAffectedElement.prop('disabled', false);
                break;
            case StarfinderEffectType.AC:
                valueAffectedElement.prop('disabled', false);
                break;
            case StarfinderEffectType.ACP:
                valueAffectedElement.prop('disabled', false);
                break;
            case StarfinderEffectType.SAVE:
                valueAffectedElement.prop('disabled', false);
                break;
            case StarfinderEffectType.SKILL:
                valueAffectedElement.prop('disabled', false);
                break;
            default:
                valueAffectedElement.prop('disabled', true);
                break;
        }

        tippy('[data-tippy-content]', {
            allowHTML: true,
            arrow: false,
            placement: 'top-start',
            duration: [500, null],
            delay: [800, null]
        });
    }

    /**
     * Update the Actor object with the new modifier data.
     * 
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     */
    _updateObject(event, formData) {
        const modifiers = duplicate(this.actor.data.data.modifiers);
        const modifier = modifiers.find(mod => mod._id === this.modifier._id);

        if (formData['modifierType'] === StarfinderModifierType.CONSTANT) {
            formData['modifier'] = parseInt(formData['modifier']);

            if (isNaN(formData['modifier'])) formData['modifier'] = 0;
        }

        mergeObject(modifier, formData);
        
        this.actor.update({'data.modifiers': modifiers});
    }
}