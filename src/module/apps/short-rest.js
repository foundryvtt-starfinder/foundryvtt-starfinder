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
        let btn = html.find('#spend-rp');
        if (this.data.canSpendRp) btn.click(this._onPerformShortRest.bind(this));
        else btn[0].disabled = true;
        super.activateListeners(html);
    }

    /**
     * Handle spending a Resolve Point as part of a Short Rest action
     * @param {Event} event The triggering click event
     * @private
     */
    async _onPerformShortRest(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        await this.actor.performShortRest();
        if (this.actor.data.data.attributes.rp.value === 0) btn.disabled = true;
    }

    static async shortRestDialog({actor, canSpendRp=true}={}) {
        const html = await renderTemplate("systems/starfinder/templates/apps/short-rest.html");
        return new Promise(resolve => {
            const dlg = new this(actor, {
                title: "Short 10 minute Rest",
                content: html,
                buttons: {
                    rest: {
                        icon: '<i class="fas fa-bed"></i>',
                        label: "Rest",
                        callback: () => resolve(true)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => resolve(false)
                    }
                },
                canSpendRp: canSpendRp
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