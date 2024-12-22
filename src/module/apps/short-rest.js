/**
 * A helper Dialog subclass for spending Resolve Points on a short 10 minute rest
 * @type {Dialog}
 */
export class ShortRestDialog extends Dialog {
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

        let restoreStaminaCheckbox = html.find('#restoreStaminaCheckbox');
        restoreStaminaCheckbox.disabled = this.data.canRestoreStaminaPoints;
        restoreStaminaCheckbox.click(this._onRestoreStaminaPoints.bind(this));
    }

    /**
     * Handle spending a Resolve Point as part of a Short Rest action
     * @param {Event} event The triggering click event
     * @private
     */
    async _onRestoreStaminaPoints(event) {
        const restoreStaminaCheckbox = event.currentTarget;
        ShortRestDialog.restoreStaminaPoints = restoreStaminaCheckbox.checked;
    }

    static async shortRestDialog({actor, canRestoreStaminaPoints = true} = {}) {
        ShortRestDialog.restoreStaminaPoints = false;
        const html = await renderTemplate("systems/sfrpg/templates/apps/short-rest.hbs");
        return new Promise(resolve => {
            const dlg = new this(actor, {
                title: game.i18n.format("SFRPG.Rest.Short.DialogTitle"),
                content: html,
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: game.i18n.format("SFRPG.Rest.Button"),
                        callback: () => resolve({resting: true, restoreStaminaPoints: this.restoreStaminaPoints})
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.format("SFRPG.Rest.Cancel"),
                        callback: () => resolve({resting: false, restoreStaminaPoints: false})
                    }
                },
                canRestoreStaminaPoints: canRestoreStaminaPoints
            });
            dlg.render(true);
        });
    }

    /**
   * A helper constructor function which displays the Long Rest confirmation dialog and returns a Promise once it's
   * workflow has been resolved.
   * @param {ActorSFRPG} actor
   * @return {Promise}
   */
    static async longRestDialog({actor} = {}) {
        const content = game.i18n.localize("SFRPG.Rest.Long.Dialog.Description");

        return new Promise((resolve, reject) => {
            new Dialog({
                title: game.i18n.localize("SFRPG.Rest.Long.Dialog.Title"),
                content: content,
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: game.i18n.localize("SFRPG.Rest.Button"),
                        callback: resolve
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("SFRPG.Rest.Cancel"),
                        callback: reject
                    }
                },
                default: 'rest',
                close: reject
            }, {classes: ["sfrpg", "dialog"]}).render(true);
        });
    }
}
