import { StarfinderModifierTypes, StarfinderModifierType } from "../modifiers/types.js";

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
     * A convience method for retrieving the actor that the modifier belongs to.
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