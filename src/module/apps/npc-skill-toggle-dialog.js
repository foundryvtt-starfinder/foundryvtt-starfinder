/**
 * A specialized Dialog for toggling which skills are 
 * visible on the NPC sheet.
 * @type {Dialog}
 * @param {Object} data The data used by the dialog
 * @param {Object} options Any options being passed to the dialog
 */
export class NpcSkillToggleDialog extends Dialog {
    constructor(data = {}, options = {}) {
        super(data, options);
        this.options.classes = ["sfrpg", "dialog"];
    }

    /**
     * Factory method used to create the dialog.
     * 
     * @param {Object} skills The list of skills for an NPC Actor
     * @returns {Promis<FormData>} Returns a Promise which resolves to 
     * the dialog FormData once the workflow has been completed.
     */
    static async create(skills = {}) {
        const html = await renderTemplate("systems/sfrpg/templates/apps/npc-skill-toggle.html", {
            config: CONFIG.SFRPG,
            skills
        });

        return new Promise((resolve) => {
            const dlg = new this({
                title: game.i18n.localize("SFRPG.NpcToggleSkillsDialogTitle"),
                content: html,
                buttons: {
                    submit: {
                        label: game.i18n.localize("SFRPG.SubmitButtonLabel"),
                        callback: html => resolve(new FormData(html[0].querySelector('#npc-toggle-skills-form')))
                    },
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("SFRPG.CancelButtonLabel")
                    }
                },
                default: "submit"
            });
            dlg.render(true);
        });
    }
}