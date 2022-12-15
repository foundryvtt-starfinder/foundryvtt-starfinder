/**
 * A helper Dialog subclass for selecting values.
 * Opens an choice dialog that allows the user to select 1 or more fields.
 * Call using ChoiceDialog.show()
 * 
 * Usage example:
 * ChoiceDialog.show("Select an option", "Please select the option(s) you would like to use.", {
            option1: {
                name: "First Option",
                options: ["Cookies", "Candies"],
                default: "Cookies"
            },
            option2: {
                name: "Second Option",
                label: "This is an optional field to clarify the second option.",
                options: ["Red", "Green", "Blue"],
                default: "Red"
            }
        }, (values) => {
            console.log("Final results:");
            console.log(values);
        });
 *
 * @type {Dialog}
 */
export class ChoiceDialog extends Dialog {
    constructor(inputData, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog"];

        this.inputData = inputData;
    }
    
    activateListeners(html) {
        super.activateListeners(html);

        for (let input of Object.keys(this.inputData)) {
            const inputElement = html.find(`#${input}`);
            inputElement.change(this._onValueChanged.bind(this));
        }
    }

    async _onValueChanged(event) {
        const inputElement = event.currentTarget;
        const key = inputElement.id;
        ChoiceDialog.output[key] = inputElement.value;
    }

    /**
     * Opens a choice dialog that allows the user to select 1 or more options.
     * @param {String} title Title of the dialog
     * @param {String} message Message text of the dialog
     * @param {Array} inputData Format: {"id": { name: "", label: "", options: [], default: "" }}
     * @param {Function} dialogCallback Format: (Object) => { "id": "value" }
     */
    static async show(title, message, inputData, dialogCallback = null) {
        ChoiceDialog.resolution = 'cancel';
        ChoiceDialog.output = {};
        for (const [key, value] of Object.entries(inputData)) {
            ChoiceDialog.output[key] = value.default;
        }

        const html = await renderTemplate("systems/sfrpg/templates/apps/choice-dialog.hbs", {
            message: message,
            choices: inputData
        });

        return new Promise(resolve => {
            const dlg = new ChoiceDialog(inputData, {
                title: title,
                content: html,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("Ok"),
                        callback: () => {
                            ChoiceDialog.resolution = 'ok';
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.format("Cancel"),
                        callback: () => {
                            ChoiceDialog.resolution = 'cancel';
                        }
                    }
                },
                default: 'yes',
                close: () => {
                    if (dialogCallback) {
                        dialogCallback({resolution: ChoiceDialog.resolution, result: ChoiceDialog.output});
                    }
                    resolve({resolution: ChoiceDialog.resolution, result: ChoiceDialog.output});
                }
            }, {});
            dlg.render(true);
        });
    }
}