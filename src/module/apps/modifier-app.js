import { SFRPGEffectType } from "../modifiers/types.js";

/**
 * Application that is used to edit a dynamic modifier.
 *
 * @param {Object} modifier The modifier being edited.
 * @param {Object} target    The actor or item that the modifier belongs to.
 * @param {Object} options  Any options that modify the rendering of the sheet.
 * @param {Object} owningActor    The actor that the target belongs to, if target is an item.
 */
export default class SFRPGModifierApplication extends FormApplication {
    constructor(modifier, target, options = {}, owningActor = null) {
        super(modifier, options);

        this.actor = target;
        this.owningActor = owningActor;
        this._tooltips = null;
    }

    static get defaultOptions() {
        let options = super.defaultOptions;

        return mergeObject(options, {
            id: 'modifier-app',
            classes: ['sfrpg', 'modifier-app'],
            template: "systems/sfrpg/templates/apps/modifier-app.hbs",
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
            isOwner: this.actor.isOwner,
            modifier: this.modifier,
            limited: this.actor.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: this.actor.isOwner ? "editable" : "locked",
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
            const affectedValue = $('.modifier-value-affected select');
            const modifierType = $('.modifier-modifier-type select');
            const effectType = current.val();
            const oldValue = this.object.effectType;

            if (oldValue === SFRPGEffectType.ACTOR_RESOURCE || effectType === SFRPGEffectType.ACTOR_RESOURCE) {
                const modifierDialog = this;
                modifierDialog.object.effectType = effectType;

                affectedValue.prop('value', "");

                this._updateModifierData(modifierDialog.object).then(() => {
                    modifierDialog.render();
                });
                return;
            }

            switch (effectType) {
                case SFRPGEffectType.ABILITY_SKILLS:
                case SFRPGEffectType.ABILITY_SCORE:
                case SFRPGEffectType.ABILITY_CHECK:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const ability of Object.entries(CONFIG.SFRPG.abilities)) {
                        affectedValue.append(`<option value="${ability[0]}">${ability[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.AC:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const armorClass of Object.entries(CONFIG.SFRPG.modifierArmorClassAffectedValues)) {
                        affectedValue.append(`<option value="${armorClass[0]}">${armorClass[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.ACP:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const acp of Object.entries(CONFIG.SFRPG.acpEffectingArmorType)) {
                        affectedValue.append(`<option value="${acp[0]}">${acp[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.SAVE:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();

                    affectedValue.append(`<option value="highest">${game.i18n.localize("SFRPG.ModifierSaveHighest")}</option>`);
                    affectedValue.append(`<option value="lowest">${game.i18n.localize("SFRPG.ModifierSaveLowest")}</option>`);
                    for (const saves of Object.entries(CONFIG.SFRPG.saves)) {
                        affectedValue.append(`<option value="${saves[0]}">${saves[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.SKILL:
                case SFRPGEffectType.SKILL_RANKS:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const skills of Object.entries(CONFIG.SFRPG.skills)) {
                        affectedValue.append(`<option value="${skills[0]}">${skills[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.SPELL_SAVE_DC:
                    affectedValue.prop('disabled', true);
                    affectedValue.find('option').remove();
                    affectedValue.append('<option value=""></option>');

                    modifierType.prop('disabled', true);
                    modifierType.prop('value', "constant");
                    break;
                case SFRPGEffectType.WEAPON_ATTACKS:
                case SFRPGEffectType.WEAPON_DAMAGE:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const weapons of Object.entries(CONFIG.SFRPG.weaponTypes)) {
                        affectedValue.append(`<option value="${weapons[0]}">${weapons[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.WEAPON_PROPERTY_ATTACKS:
                case SFRPGEffectType.WEAPON_PROPERTY_DAMAGE:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const weapons of Object.entries(CONFIG.SFRPG.weaponProperties)) {
                        affectedValue.append(`<option value="${weapons[0]}">${weapons[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.WEAPON_CATEGORY_ATTACKS:
                case SFRPGEffectType.WEAPON_CATEGORY_DAMAGE:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();
                    for (const weapons of Object.entries(CONFIG.SFRPG.weaponCategories)) {
                        affectedValue.append(`<option value="${weapons[0]}">${weapons[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.SPECIFIC_SPEED:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();

                    for (const speeds of Object.entries(CONFIG.SFRPG.speeds)) {
                        affectedValue.append(`<option value="${speeds[0]}">${speeds[1]}</option>`);
                    }
                    break;
                case SFRPGEffectType.DAMAGE_REDUCTION:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();

                    for (const [key, name] of Object.entries(CONFIG.SFRPG.damageReductionTypes)) {
                        affectedValue.append(`<option value="${key}">${name}</option>`);
                    }
                    break;
                case SFRPGEffectType.ENERGY_RESISTANCE:
                    affectedValue.prop('disabled', false);
                    affectedValue.find('option').remove();

                    for (const [key, name] of Object.entries(CONFIG.SFRPG.energyResistanceTypes)) {
                        affectedValue.append(`<option value="${key}">${name}</option>`);
                    }
                    break;
                default:
                    affectedValue.prop('disabled', true);
                    affectedValue.find('option').remove();
                    affectedValue.append('<option value=""></option>');

                    modifierType.prop('disabled', false);
                    break;
            }
        });
    }

    /** @override */
    async _render(...args) {
        await super._render(...args);

        const effectType = this.element.find('.modifier-effect-type select').val();
        const valueAffectedElement = this.element.find('.modifier-value-affected select');
        const modifierTypeElement = this.element.find('.modifier-modifier-type select');

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
            case SFRPGEffectType.SPELL_SAVE_DC:
                modifierTypeElement.prop('disabled', true);
                modifierTypeElement.prop('value', "constant");
                break;
            case SFRPGEffectType.WEAPON_ATTACKS:
            case SFRPGEffectType.WEAPON_PROPERTY_ATTACKS:
            case SFRPGEffectType.WEAPON_CATEGORY_ATTACKS:
            case SFRPGEffectType.WEAPON_DAMAGE:
            case SFRPGEffectType.WEAPON_PROPERTY_DAMAGE:
            case SFRPGEffectType.WEAPON_CATEGORY_DAMAGE:
            case SFRPGEffectType.SPECIFIC_SPEED:
            case SFRPGEffectType.DAMAGE_REDUCTION:
            case SFRPGEffectType.ENERGY_RESISTANCE:
            case SFRPGEffectType.ACTOR_RESOURCE:
                valueAffectedElement.prop('disabled', false);
                break;
            default:
                valueAffectedElement.prop('disabled', true);
                break;
        }

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

    async close(...args) {
        if (this._tooltips !== null) {
            for (const tooltip of this._tooltips) {
                tooltip.destroy();
            }

            this._tooltips = null;
        }

        return super.close(...args);
    }

    /**
     * Update the Actor object with the new modifier data.
     *
     * @param {Event} event The event that triggers the update
     * @param {Object} formData The data from the form
     */
    _updateObject(event, formData) {
        return this._updateModifierData(formData);
    }

    async _updateModifierData(formData) {
        const modifiers = deepClone(this.actor.system.modifiers);
        const modifier = modifiers.find(mod => mod._id === this.modifier._id);

        const formula = formData['modifier'];
        if (formula) {
            const roll = Roll.create(formula, this.owningActor?.system || this.actor.system);
            modifier.max = await roll.evaluate({maximize: true}).total;
        } else {
            modifier.max = 0;
        }

        mergeObject(modifier, formData);

        return this.actor.update({'system.modifiers': modifiers});
    }
}
