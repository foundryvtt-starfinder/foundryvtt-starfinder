import { DiceSFRPG } from "../../dice.js";
import RollContext from "../../rolls/rollcontext.js";
import { ActorSheetSFRPG } from "./base.js";

export class ActorSheetSFRPGHazard extends ActorSheetSFRPG {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sfrpg", "sheet", "actor", "hazard"],
            width: 600
            // height: 685
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sfrpg/templates/actors/hazard-sheet-limited.hbs";
        return "systems/sfrpg/templates/actors/hazard-sheet-full.hbs";
    }

    async getData() {
        const data = await super.getData();

        // Enrich text editors
        data.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.details.description.value, {
            async: true,
            rollData: this.actor.getRollData() ?? {},
            secrets: this.actor.isOwner
        });

        return data;
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

        const textAreas = this._element.find('textarea');
        for (let i = 0; i < textAreas.length; i++) {
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
        return await this._performRoll(event, name, this.actor.system.attributes.fort.value, false);
    }

    async _onReflexSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Reflex", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.reflex.value, false);
    }

    async _onWillSaveClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Will", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.will.value, false);
    }

    async _onAttackClicked(event) {
        event.preventDefault();

        const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Attack", {name: this.actor.name});
        return await this._performRoll(event, name, this.actor.system.attributes.baseAttackBonus.value, true);
    }

    async _onDamageClicked(event) {
        event.preventDefault();

        if (this.actor.system.attributes.damage.value) {
            const rollContext = RollContext.createActorRollContext(this.actor);

            const name = game.i18n.format("SFRPG.HazardSheet.Rolls.Damage", {name: this.actor.name});
            await DiceSFRPG.damageRoll({
                event: event,
                rollContext: rollContext,
                parts: [{ formula: this.actor.system.attributes.damage.value }],
                title: name,
                flavor: null,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                dialogOptions: {
                    left: event ? event.clientX - 80 : null,
                    top: event ? event.clientY - 80 : null
                },
                onClose: (roll, formula, finalFormula, isCritical) => {
                    if (roll) {
                        Hooks.callAll("damageRolled", {actor: this.actor, item: null, roll: roll, isCritical: isCritical, formula: {base: formula, final: finalFormula}, rollMetadata: null});
                    }
                }
            });
        } else {
            ui.notifications.warn(game.i18n.format("SFRPG.HazardSheet.Notifications.NoDamage", {name: this.actor.name}));
        }
    }

    _performRoll(event, rollName, rollValue, isAttack) {
        const rollContext = RollContext.createActorRollContext(this.actor);

        return DiceSFRPG.d20Roll({
            event: event,
            rollContext: rollContext,
            parts: [rollValue],
            title: rollName,
            flavor: null,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            dialogOptions: {
                left: event ? event.clientX - 80 : null,
                top: event ? event.clientY - 80 : null
            },
            onClose: (roll, formula, finalFormula) => {
                if (roll && isAttack) {
                    Hooks.callAll("attackRolled", {actor: this.actor, item: null, roll: roll, formula: {base: formula, final: finalFormula}, rollMetadata: null});
                }
            }
        });
    }
}
