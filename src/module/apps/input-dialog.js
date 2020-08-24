/**
 * A helper Dialog subclass for entering values.
 * Opens an input dialog that allows the user to enter 1 or more fields. Supports entry validation.
 * Call using InputDialog.show()
 * 
 * Usage example:
 * InputDialog.show("Enter a value", "Please enter values", {
            cookies: {
                name: "Cookies",
                label: "Name of the cookies you want.",
                placeholder: "Chocolate Chip",
                validator: (v) => true
            },
            amount: {
                name: "Amount",
                label: "How many cookies you want.",
                placeholder: "10",
                validator: (v) => !Number.isNaN(Number(v))
            }
        }, (values) => {
            console.log("Final results:");
            console.log(values);
        });
 *
 * @type {Dialog}
 */
export class InputDialog extends Dialog {
    constructor(inputData, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog"];

        this.inputData = inputData;
    }
    
    activateListeners(html) {
        super.activateListeners(html);

        let focused = false;
        for (let input of Object.keys(this.inputData)) {
            let inputElement = html.find(`#${input}`);
            inputElement.change(this._onValueChanged.bind(this));

            if (!focused) {
                focused = true;
                inputElement.focus();
            }
        }
    }

    async _onValueChanged(event) {
        const inputElement = event.currentTarget;
        const key = inputElement.id;
        const inputValue = InputDialog.values[key];
        inputValue.value = inputElement.value;
        if (inputValue.validator) {
            let isValid = inputValue.validator(inputValue.value)
            if (!isValid) {
                let message = game.i18n.format("SFRPG.Dialogs.InputDialog.SingleFieldInvalid", { fieldName: inputValue.name });
                ui.notifications.error(message);
                if (!inputElement.classList.contains("error")) {
                    inputElement.classList.add("error");
                }
            } else {
                if (inputElement.classList.contains("error")) {
                    inputElement.classList.remove("error");
                }
            }
        }
    }

    /**
     * Opens an input dialog that allows the user to enter 1 or more fields. Supports entry validation.
     * @param {String} title Title of the dialog
     * @param {String} message Message text of the dialog
     * @param {Array} inputData Format: {"id": { label: "", placeholder="", validator: (value) => { return true }}]
     * @param {Function} dialogCallback Format: (Object) => { "id": "value" }
     */
    static async show(title, message, inputData, dialogCallback) {
        InputDialog.values = inputData;
        for (let key of Object.keys(InputDialog.values)) {
            InputDialog.values[key].value = InputDialog.values[key].placeholder;
        }

        const html = await renderTemplate("systems/sfrpg/templates/apps/input-dialog.html", {
            message: message,
            inputs: inputData
        });

        return new Promise(resolve => {
            const dlg = new InputDialog(inputData, {
                title: title,
                content: html,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("Yes"),
                        callback: () => {
                            let invalidFields = [];
                            let returnValues = {};
                            for (let key of Object.keys(InputDialog.values)) {
                                const value = InputDialog.values[key];
                                returnValues[key] = value.value;
                                if (value.validator && !value.validator(value.value)) {
                                    invalidFields.push(value.name);
                                }
                            }

                            if (invalidFields.length == 0) {
                                dialogCallback(returnValues);
                            } else {
                                let errorMessage = "";
                                for (let invalidField of invalidFields) {
                                    errorMessage += invalidField + "<br/>";
                                }
                                errorMessage = game.i18n.format("SFRPG.Dialogs.InputDialog.MultipleFieldsInvalid", { fieldNames: errorMessage });
                                throw errorMessage;
                            }
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.format("No"),
                        callback: () => resolve()
                    }
                },
                default: 'no',
                close: resolve
            }, {});
            dlg.render(true);
        });
    }
}