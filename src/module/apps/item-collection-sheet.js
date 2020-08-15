export class ItemCollectionSheet extends BaseEntitySheet {
    constructor(itemCollection) {
        super(itemCollection, {});
        this.itemCollection = itemCollection;

        Hooks.on("deleteToken", (scene, token, options, userId) => this._handleTokenDelete(scene, token, options, userId));
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
        Hooks.off("deleteToken", this._handleTokenDelete);
        super.close(options);
    }

    _handleTokenDelete(scene, token, options, userId) {
        if (token._id === this.itemCollection.id) {
            this.close();
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('#toggle-locked').click(this._toggleLocked.bind(this));
        html.find('#toggle-delete-if-empty').click(this._toggleDeleteIfEmpty.bind(this));
    }

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     */
    getData() {
        const data = super.getData();
        data.config = CONFIG.SFRPG;
        data.isCharacter = true;
        data.owner = false;
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
        data.locked = this.entity.data.flags.sfrpg.itemCollection.locked;
        data.deleteIfEmpty = this.entity.data.flags.sfrpg.itemCollection.deleteIfEmpty;

        return data;
    }

    processItemContainment(items, pushItemFn) {
        let preprocessedItems = [];
        let containedItems = [];
        for (let item of items) {
            let itemData = {
                item: item,
                parent: items.find(x => x.data.contents && x.data.contents.includes(item._id)),
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
            if (draggedItems[i].data.contents) {
                let newContents = [];
                for (let contentId of draggedItems[i].data.contents) {
                    let contentItem = tokenData.items.find(x => x._id === contentId);
                    if (contentItem) {
                        draggedItems.push(contentItem);
                        newContents.push(contentItem._id);
                    }
                }
                draggedItems[i].data.contents = newContents;
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

        return false;
  
      // Try to extract the data
      let data;
      try {
        data = JSON.parse(event.dataTransfer.getData('text/plain'));
        if (data.type !== "Item") return;
      } catch (err) {
        return false;
      }
  
      // Case 1 - Import from a Compendium pack
      const actor = this.actor;
      if (data.pack) {
        return actor.importItemFromCollection(data.pack, data.id);
      }
  
      // Case 2 - Data explicitly provided
      else if (data.data) {
        let sameActor = data.actorId === actor._id;
        if (sameActor && actor.isToken) sameActor = data.tokenId === actor.token.id;
        if (sameActor) return this._onSortItem(event, data.data); // Sort existing items
        else return actor.createEmbeddedEntity("OwnedItem", duplicate(data.data));  // Create a new Item
      }
  
      // Case 3 - Import from World entity
      else {
        let item = game.items.get(data.id);
        if (!item) return;
        return actor.createEmbeddedEntity("OwnedItem", duplicate(item.data));
      }
    }
}