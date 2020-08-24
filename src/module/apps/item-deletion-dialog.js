/**
 * A helper Dialog subclass for confirming deletion of items.
 * @type {Dialog}
 */
export class ItemDeletionDialog extends Dialog {
    constructor(itemName, containsItems, confirmationCallback, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog"];

        this.itemName = itemName;
        this.containsItems = containsItems;
        this.confirmationCallback = confirmationCallback;
    }
    
    activateListeners(html) {
        super.activateListeners(html);

        let recursiveDeleteCheckbox = html.find('#recursiveDeleteCheckbox');
        recursiveDeleteCheckbox.click(this._onToggleRecursiveDelete.bind(this));
    }

    async _onToggleRecursiveDelete(event) {
        const recursiveDeleteCheckbox = event.currentTarget;
        ItemDeletionDialog.recursiveDelete = recursiveDeleteCheckbox.checked;
    }

    static async show(itemName, containsItems, confirmationCallback) {
        ItemDeletionDialog.recursiveDelete = false;
        const html = await renderTemplate("systems/sfrpg/templates/apps/item-deletion-dialog.html", {
            message: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DeleteConfirmationMessage", { itemName: itemName }),
            containsItems: containsItems,
            recursiveDelete: ItemDeletionDialog.recursiveDelete
        });
        return new Promise(resolve => {
            const dlg = new ItemDeletionDialog(itemName, containsItems, confirmationCallback, {
                title: game.i18n.format("SFRPG.ActorSheet.Inventory.Interface.DeleteConfirmationTitle", { itemName: itemName }),
                content: html,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.format("Yes"),
                        callback: () => confirmationCallback(ItemDeletionDialog.recursiveDelete)
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