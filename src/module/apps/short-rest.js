/**
 * A helper Dialog subclass for spending Resolve Points on a short 10 minute rest
 * @type {Dialog}
 */
export class ShortRestDialog extends Dialog {
    constructor(actor, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["starfinder", "dialog"];

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

    static async shortRestDialog({actor, canRestoreStaminaPoints=true}={}) {
        ShortRestDialog.restoreStaminaPoints = false;
        const html = await renderTemplate("systems/starfinder/templates/apps/short-rest.html");
        return new Promise(resolve => {
            const dlg = new this(actor, {
                title: game.i18n.format("STARFINDER.RestSTitle"),
                content: html,
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: game.i18n.format("STARFINDER.RestButton"),
                        callback: () => resolve({resting: true, restoreStaminaPoints: this.restoreStaminaPoints})
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.format("STARFINDER.RestCancel"),
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
   * @param {ActorStarfinder} actor
   * @return {Promise}
   */
    static async longRestDialog({actor}={}) {
        const content = `<p>Take a night's rest?</p><p>On a night's rest you will recover 1 hit point per character level, all stamina points,
            all resolve points, class resources, limited use item charges, and spell slots.</p>`;

        return new Promise((resolve, reject) => {
            new Dialog({
                title: "Night's Rest",
                content: content,
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: "Rest",
                        callback: resolve
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: reject
                    }
                },
                default: 'rest',
                close: reject
            }, {classes: ["starfinder", "dialog"]}).render(true);
        });
    }
}