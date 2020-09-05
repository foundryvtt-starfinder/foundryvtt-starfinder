import { ItemDeletionDialog } from "./item-deletion-dialog.js"
import { ItemSheetSFRPG } from "../item/sheet.js"
import { RPC } from "../rpc.js"

export class ItemCollectionSheet extends BaseEntitySheet {
    constructor(itemCollection) {
        super(itemCollection, {});
        this.itemCollection = itemCollection;

        this.updateCallback = (scene, token, options, userId) => this._handleTokenUpdated(scene, token, options, userId);
        Hooks.on("updateToken", this.updateCallback);
        this.deleteCallback = (scene, token, options, userId) => this._handleTokenDelete(scene, token, options, userId);
        Hooks.on("deleteToken", this.deleteCallback);
    }

    static get defaultOptions() {
        const defaultOptions = super.defaultOptions;
        return mergeObject(defaultOptions, {
            classes: defaultOptions.classes.concat(['sfrpg', 'actor', 'sheet', 'npc']),
            height: 720,
            width: 720,
            template: "systems/sfrpg/templates/apps/item-collection-sheet.html",
            closeOnSubmit: false,
            submitOnClose: true,
            submitOnChange: true,
            resizable: true,
            dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
        });
    }

    async close(options={}) {
        delete this.entity.apps[this.appId];
        Hooks.off("updateToken", this.updateCallback);
        Hooks.off("deleteToken", this.deleteCallback);
        super.close(options);
    }

    _handleTokenUpdated(scene, token, options, userId) {
        if (token._id === this.itemCollection.id && token.flags.sfrpg.itemCollection.locked && !game.user.isGM) {
            this.close();
        }
    }

    _handleTokenDelete(scene, token, options, userId) {
        if (token._id === this.itemCollection.id) {
            this.close();
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.item .item-name h4').click(event => this._onItemSummary(event));

        if (game.user.isGM) {
            html.find('img[data-edit]').click(ev => this._onEditImage(ev));
            html.find('#toggle-locked').click(this._toggleLocked.bind(this));
            html.find('#toggle-delete-if-empty').click(this._toggleDeleteIfEmpty.bind(this));

            html.find('.item-edit').click(ev => this._onItemEdit(ev));
            html.find('.item-delete').click(ev => this._onItemDelete(ev));
        }
    }

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     */
    getData() {
        const data = super.getData();
        data.config = CONFIG.SFRPG;
        data.isCharacter = true;
        data.owner = game.user.isGM;
        data.isGM = game.user.isGM;

        const tokenData = this.entity.getFlag("sfrpg", "itemCollection");

        let items = duplicate(tokenData.items);
        for (let item of items) {
            item.img = item.img || DEFAULT_TOKEN;

            item.data.quantity = item.data.quantity || 0;
            item.data.price = item.data.price || 0;
            item.data.bulk = item.data.bulk || "-";

            let weight = 0;
            if (item.data.bulk === "L") {
                weight = 0.1;
            } else if (item.data.bulk === "-") {
                weight = 0;
            } else {
                weight = parseFloat(item.data.bulk);
            }

            item.totalWeight = item.data.quantity * weight;
            if (item.data.equippedBulkMultiplier !== undefined && item.data.equipped) {
                item.totalWeight *= item.data.equippedBulkMultiplier;
            }
            item.totalWeight = item.totalWeight < 1 && item.totalWeight > 0 ? "L" : 
                            item.totalWeight === 0 ? "-" : Math.floor(item.totalWeight);
        }

        data.items = [];
        this.processItemContainment(items, function (itemType, itemData) {
            data.items.push(itemData);
        });

        data.itemCollection = this.entity.data.flags.sfrpg.itemCollection;

        if (data.itemCollection.locked && !game.user.isGM) {
            this.close();
        }

        return data;
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
    }

    processItemContainment(items, pushItemFn) {
        let preprocessedItems = [];
        let containedItems = [];
        for (let item of items) {
            let itemData = {
                item: item,
                parent: items.find(x => x.data.container?.contents && x.data.container.contents.find(y => y.id === item._id)),
                contents: []
            };
            preprocessedItems.push(itemData);

            if (!itemData.parent) {
                pushItemFn(item.type, itemData);
            } else {
                containedItems.push(itemData);
            }
        }

        for (let item of containedItems) {
            let parent = preprocessedItems.find(x => x.item._id === item.parent._id);
            if (parent) {
                parent.contents.push(item);
            }
        }
    }

    async _toggleLocked(event) {
        event.preventDefault();

        await this.itemCollection.update({
            "flags.sfrpg.itemCollection.locked": !this.entity.data.flags.sfrpg.itemCollection.locked
        });
    }

    async _toggleDeleteIfEmpty(event) {
        event.preventDefault();

        await this.itemCollection.update({
            "flags.sfrpg.itemCollection.deleteIfEmpty": !this.entity.data.flags.sfrpg.itemCollection.deleteIfEmpty
        });
    }

    /**
     * Handle rolling of an item form the Actor sheet, obtaining the item instance an dispatching to it's roll method.
     * 
     * @param {Event} event The html event
     */
    _onItemSummary(event) {
        event.preventDefault();
        let li = $(event.currentTarget).parents('.item');
        let itemId = li.attr("data-item-id");
        const item = this.itemCollection.data.flags.sfrpg.itemCollection.items.find(x => x._id === itemId);
        let chatData = this.getChatData(item, { secrets: true, rollData: item.data.data });

        if (li.hasClass('expanded')) {
            let summary = li.children('.item-summary');
            summary.slideUp(200, () => summary.remove());
        } else {
            let div = $(`<div class="item-summary">${chatData.description.value}</div>`);
            let props = $(`<div class="item-properties"></div>`);
            chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
            div.append(props);
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass('expanded');
    }

    _onItemEdit(event) {
        let itemId = $(event.currentTarget).parents('.item').attr("data-item-id");
        const item = this.itemCollection.data.flags.sfrpg.itemCollection.items.find(x => x._id === itemId);
        const itemData = {
            data: duplicate(item),
            labels: {},
            apps: {}
        };
        let sheet = new ItemSheetSFRPG(itemData, {submitOnChange: false, submitOnClose: false, editable: false});
        sheet.render(true);
    }

    /**
     * Handle deleting an Owned Item for the actor
     * @param {Event} event The originating click event
     */
    _onItemDelete(event) {
        event.preventDefault();

        // TODO: Confirm dialog, and ask to recursively delete nested items, if it is the last item and deleteIfEmpty is enabled, also ask

        let li = $(event.currentTarget).parents(".item");
        let itemId = li.attr("data-item-id");

        const itemToDelete = this.itemCollection.data.flags.sfrpg.itemCollection.items.find(x => x._id === itemId);
        let containsItems = (itemToDelete.data.container?.contents && itemToDelete.data.container.contents.length > 0);
        ItemDeletionDialog.show(itemToDelete.name, containsItems, (recursive) => {
            this._deleteItemById(itemId, recursive);
            li.slideUp(200, () => this.render(false));
        });
    }

    _deleteItemById(itemId, recursive = false) {
        let itemsToDelete = [itemId];

        if (recursive) {
            let itemsToTest = [itemId];
            while (itemsToTest.length > 0) {
                let itemIdToTest = itemsToTest.shift();
                let itemData = this.itemCollection.data.flags.sfrpg.itemCollection.items.find(x => x._id === itemIdToTest);
                if (itemData.data.container?.contents) {
                    for (let content of itemData.data.container.contents) {
                        itemsToDelete.push(content.id);
                        itemsToTest.push(content.id);
                    }
                }
            }
        }

        const newItems = this.itemCollection.data.flags.sfrpg.itemCollection.items.filter(x => !itemsToDelete.includes(x._id));
        const update = {
            "flags.sfrpg.itemCollection.items": newItems
        }

        if (newItems.length === 0 && this.itemCollection.data.flags.sfrpg.itemCollection.deleteIfEmpty) {
            this.itemCollection.delete();
        } else {
            this.itemCollection.update(update);
        }
    }

    findItem(itemId) {
        return this.itemCollection.data.flags.sfrpg.itemCollection.items.find(x => x._id === itemId);
    }

    getItems() {
        return this.itemCollection.data.flags.sfrpg.itemCollection.items;
    }
    
    getChatData(itemData, htmlOptions) {
        const data = duplicate(itemData.data);
        const labels = itemData.labels || {};

        // Rich text description
        data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);

        // Item type specific properties
        const props = [];
        const fn = itemData[`_${itemData.data.type}ChatData`];
        if (fn) fn.bind(itemData)(data, labels, props);

        // General equipment properties
        if (data.hasOwnProperty("equipped") && !["goods", "augmentation", "technological", "upgrade"].includes(itemData.data.type)) {
            props.push(
                data.equipped ? "Equipped" : "Not Equipped",
                data.proficient ? "Proficient" : "Not Proficient",
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            props.push(
                labels.target,
                labels.area,
                labels.activation,
                labels.range,
                labels.duration
            );
        }

        if (data.hasOwnProperty("capacity")) {
            props.push(
                labels.capacity
            );
        }

        // Filter properties and return
        data.properties = props.filter(p => !!p);
        return data;
    }

    /* -------------------------------------------- */
  
    /**
     * Handle changing the actor profile image by opening a FilePicker
     * @private
     */
    _onEditImage(event) {
      const attr = event.currentTarget.dataset.edit;
      const current = getProperty(this.entity.data, attr);
      new FilePicker({
        type: "image",
        current: current,
        callback: path => {
          event.currentTarget.src = path;
          this._onSubmit(event);
        },
        top: this.position.top + 40,
        left: this.position.left + 10
      }).browse(current);
    }

    /* -------------------------------------------- */
    /*  Drag and Drop                               */
    /* -------------------------------------------- */
  
    /** @override */
    _canDragStart(selector) {
      return true; // flags.sfrpg.itemCollection.locked || game.user.isGM
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    _canDragDrop(selector) {
        return true; // flags.sfrpg.itemCollection.locked || game.user.isGM
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget;
        const tokenData = this.entity.getFlag("sfrpg", "itemCollection");

        if (tokenData.locked && !game.user.isGM) {
            return;
        }

        const item = tokenData.items.find(x => x._id === li.dataset.itemId);
        let draggedItems = [item];
        for (let i = 0; i<draggedItems.length; i++) {
            if (draggedItems[i].data.container?.contents) {
                let newContents = [];
                for (let content of draggedItems[i].data.container.contents) {
                    let contentItem = tokenData.items.find(x => x._id === content.id);
                    if (contentItem) {
                        draggedItems.push(contentItem);
                        newContents.push({id: contentItem._id, index: content.index});
                    }
                }
                draggedItems[i].data.container.contents = newContents;
            }
        }

        const dragData = {
            type: "ItemCollection",
            tokenId: this.entity.id,
            sceneId: this.entity.scene._id,
            items: draggedItems
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
  
    /* -------------------------------------------- */
  
    /**
     * @deprecated since 0.5.6
     */
    _onDragItemStart(event) {
      return this._onDragStart(event);
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    async _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.type !== "Item") return;
        } catch (err) {
            return false;
        }

        let targetContainer = null;
        if (event) {
            const targetId = $(event.target).parents('.item').attr('data-item-id')
            targetContainer = this.findItem(targetId);
        }

        const msg = {
            target: {
                actorId: null,
                tokenId: this.itemCollection.id,
                sceneId: this.itemCollection.scene._id
            },
            source: {
                actorId: data.actorId,
                tokenId: data.tokenId,
                sceneId: data.sceneId,
            },
            draggedItemId: data.id,
            draggedItemData: data.data,
            pack: data.pack,
            containerId: targetContainer ? targetContainer._id : null
        }

        RPC.sendMessageTo("gm", "dragItemToCollection", msg);
    }
}