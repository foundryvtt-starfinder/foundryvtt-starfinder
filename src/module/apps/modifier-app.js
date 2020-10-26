import { SFRPGModifierTypes, SFRPGModifierType, SFRPGEffectType } from "../modifiers/types.js";

/**
 * Application that is used to edit a dynamic modifier.
 * 
 * @param {Object} modifier The modifier being edited.
 * @param {Object} target    The actor or item that the modifier belongs to.
 * @param {Object} options  Any options that modify the rendering of the sheet.
 * @param {Object} owner    The actor that the target belongs to, if target is an item.
 */
export default class SFRPGModifierApplication extends FormApplication {
    constructor(modifier, target, options={}, owner = null) {
        super(modifier, options);

        this.actor = target;
        this.owner = owner;
    }

    static get defaultOptions() {
        let options = super.defaultOptions;

        return mergeObject(options, {
            id: 'modifier-app',
            classes: ['sfrpg', 'modifier-app'],
            template: "systems/sfrpg/templates/apps/modifier-app.html",
            width: 400,
            height: 'auto',
            closeOnSubmit: true
        });
    }

    /** @override */
    get title() {
        return game.i18n.format("SFRPG.ModifierAppTitle", {name: this.modifier.name});
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
            config: CONFIG.SFRPG
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
                case SFRPGEffectType.ABILITY_SKILLS:
                case SFRPGEffectType.ABILITY_SCORE:
                case SFRPGEffectType.ABILITY_CHECK:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const ability of Object.entries(CONFIG.SFRPG.abilities)) {
                        target.append(`<option value="${ability[0]}">${ability[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.AC:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const armorClass of Object.entries(CONFIG.SFRPG.modifierArmorClassAffectedValues)) {
                        target.append(`<option value="${armorClass[0]}">${armorClass[1]}</option>`)
                    }
                    break;
                case SFRPGEffectType.ACP:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const acp of Object.entries(CONFIG.SFRPG.acpEffectingArmorType)) {
                        target.append(`<option value="${acp[0]}">${acp[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.SAVE:
                    target.prop('disabled', false);
                    target.find('option').remove();

                    target.append(`<option value="highest">${game.i18n.localize("SFRPG.ModifierSaveHighest")}</option>`);
                    target.append(`<option value="lowest">${game.i18n.localize("SFRPG.ModifierSaveLowest")}</option>`);
                    for (const saves of Object.entries(CONFIG.SFRPG.saves)) {
                        target.append(`<option value="${saves[0]}">${saves[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.SKILL:
                case SFRPGEffectType.SKILL_RANKS:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const skills of Object.entries(CONFIG.SFRPG.skills)) {
                        target.append(`<option value="${skills[0]}">${skills[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.WEAPON_ATTACKS:
                case SFRPGEffectType.WEAPON_DAMAGE:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const weapons of Object.entries(CONFIG.SFRPG.weaponTypes)) {
                        target.append(`<option value="${weapons[0]}">${weapons[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.WEAPON_PROPERTY_DAMAGE:
                    target.prop('disabled', false);
                    target.find('option').remove();
                    for (const weapons of Object.entries(CONFIG.SFRPG.weaponProperties)) {
                        target.append(`<option value="${weapons[0]}">${weapons[1]}</option>`);
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
            case SFRPGEffectType.ABILITY_SKILLS:
                valueAffectedElement.prop('disabled', false);
                break;
            case SFRPGEffectType.ABILITY_SCORE:
                valueAffectedElement.prop('disabled', false);
                break;
            case SFRPGEffectType.AC:
                valueAffectedElement.prop('disabled', false);
                break;
            case SFRPGEffectType.ACP:
                valueAffectedElement.prop('disabled', false);
                break;
            case SFRPGEffectType.SAVE:
                valueAffectedElement.prop('disabled', false);
                break;
            case SFRPGEffectType.SKILL:
            case SFRPGEffectType.SKILL_RANKS:
                valueAffectedElement.prop('disabled', false);
                break;
            case SFRPGEffectType.WEAPON_ATTACKS:
            case SFRPGEffectType.WEAPON_DAMAGE:
            case SFRPGEffectType.WEAPON_PROPERTY_DAMAGE:
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

        const roll = new Roll(formData['modifier'], this.owner?.data?.data || this.actor.data.data);
        modifier.max = roll.evaluate({maximize: true}).total;

        mergeObject(modifier, formData);
        
        this.actor.update({'data.modifiers': modifiers});
    }
}