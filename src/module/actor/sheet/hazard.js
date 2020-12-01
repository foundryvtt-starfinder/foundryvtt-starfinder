import { DiceSFRPG, RollContext } from "../../dice.js";
import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGHazard extends ActorSheetSFRPG {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sfrpg", "sheet", "actor", "hazard"],
            width: 600,
            height: 685
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sfrpg/templates/actors/hazard-sheet-limited.html";
        return "systems/sfrpg/templates/actors/hazard-sheet-full.html";
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('#fortSave').click(this._onFortSaveClicked.bind(this));
        html.find('#reflexSave').click(this._onReflexSaveClicked.bind(this));
        html.find('#willSave').click(this._onWillSaveClicked.bind(this));

        html.find('#attack').click(this._onAttackClicked.bind(this));
        html.find('#damage').click(this._onDamageClicked.bind(this));
    }

    async _render(...args) {
        await super._render(...args);

        tippy('[data-tippy-content]', {
            allowHTML: true,
            arrow: false,
            placement: 'top-start',
            duration: [500, null],
            delay: [800, null]
        });

        const textAreas = this._element.find('textarea');
        for (let i = 0; i<textAreas.length; i++) {
            const textArea = textAreas[i];
            textArea.style.height = textArea.scrollHeight + "px";
        }
    }

    /**
     * Organize and classify items for hazard sheets.
     * Hazards don't need items, but this function is required because base.js calls it.
     * 
     * @param {Object} data Data for the sheet
     */
    _prepareItems(data) {

    }

    async _onFortSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Fortitude", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.data.data.attributes.fort.value);
    }

    async _onReflexSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Reflex", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.data.data.attributes.reflex.value);
    }

    async _onWillSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Will", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.data.data.attributes.will.value);
    }

    async _onAttackClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Attack", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.data.data.attributes.baseAttackBonus.value);
    }

    async _onDamageClicked(event) {
        event.preventDefault();

        if (this.actor.data.data.attributes.damage.value) {
            const rollContext = new RollContext();
            rollContext.addContext("main", this.actor);
            rollContext.setMainContext("main");
    
            this.actor.setupRollContexts(rollContext);
    
            const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Damage", {name: this.actor.name});
            return DiceSFRPG.damageRoll({
                event: event,
                rollContext: rollContext,
                parts: [this.actor.data.data.attributes.damage.value],
                title: name,
                flavor: name,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                dialogOptions: {
                    left: event ? event.clientX - 80 : null,
                    top: event ? event.clientY - 80 : null
                }
            });
        } else {
            ui.notifications.warn(game.i18n.format("SFRPG.HazardSheet.Notifications.NoDamage", {name: this.actor.name}));
        }
    }

    _performRoll(event, rollName, rollValue) {
        const rollContext = new RollContext();
        rollContext.addContext("main", this.actor);
        rollContext.setMainContext("main");

        this.actor.setupRollContexts(rollContext);

        return DiceSFRPG.d20Roll({
            event: event,
            rollContext: rollContext,
            parts: [rollValue],
            title: rollName,
            flavor: rollName,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                left: event ? event.clientX - 80 : null,
                top: event ? event.clientY - 80 : null
            }
        });
    }
}