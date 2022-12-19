/**
 * A helper Dialog subclass for repairing drones
 * @type {Dialog}
 */
export class DroneRepairDialog extends Dialog {
    constructor(actor, dialogData = {}, options = {}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog"];

        /**
         * Store a reference to the Actor entity which is resting
         * @type {Actor}
         */
        this.actor = actor;
    }

    activateListeners(html) {
        super.activateListeners(html);

        let improvedRepairFeatCheckbox = html.find('#improvedRepairFeatCheckbox');
        improvedRepairFeatCheckbox.disabled = this.data.improvedRepairFeatCheckbox;
        improvedRepairFeatCheckbox.click(this._improvedRepairFeat.bind(this));
    }

    /**
     * Handle spending a Resolve Point as part of a Short Rest action
     * @param {Event} event The triggering click event
     * @private
     */
    async _improvedRepairFeat(event) {
        const improvedRepairFeatCheckbox = event.currentTarget;
        DroneRepairDialog.improvedRepairFeat = improvedRepairFeatCheckbox.checked;
    }

    static async droneRepairDialog({actor, improvedRepairFeat = false} = {}) {
        DroneRepairDialog.restoreStaminaPoints = false;
        const html = await renderTemplate("systems/sfrpg/templates/apps/drone-repair.hbs");
        return new Promise(resolve => {
            const dlg = new this(actor, {
                title: game.i18n.format("SFRPG.RepairDroneDialogTitle"),
                content: html,
                buttons: {
                    repair: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("SFRPG.RepairDroneDialogRepairButton"),
                        callback: () => resolve({repairing: true, improvedRepairFeat: this.improvedRepairFeat})
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.format("SFRPG.RepairDroneDialogCancelButton"),
                        callback: () => resolve({repairing: false, improvedRepairFeat: false})
                    }
                },
                improvedRepairFeat: improvedRepairFeat
            });
            dlg.render(true);
        });
    }
}
