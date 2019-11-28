import { ActorSheetStarfinder } from "./base.js"

export class ActorSheetStarfinderCharacter extends ActorSheetStarfinder {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: ['starfinder', 'sheet', 'actor', 'character'],
            width: 690,
            height: 800
        });

        return options;
    }

    get template() {
        const path = "systems/starfinder/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "character-sheet.html";
    }

    getData() {
        const sheetData = super.getData();

        let hp = sheetData.data.attributes.hp;
        if (hp.temp === 0) delete hp.temp;
        if (hp.tempmax === 0) delete hp.tempmax;

        sheetData["disableExperience"] = game.settings.get("starfinder", "disableExperienceTracking");

        return sheetData;
    }

    /**
     * Organize and classify items for character sheets.
     * 
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {

        const actorData = data.actor;

        const inventory = {
            weapon: { label: "Weapons", items: [], dataset: { type: "weapon" } },
            equipment: { label: "Equipment", items: [], dataset: { type: "equipment" } },
            consumable: { label: "Consumables", items: [], dataset: { type: "consumable" } },
            goods: { label: "Goods", items: [], dataset: { type: "goods" } },
            technological: { label: "Technological", items: [], dataset: { type: "technological" } },
            fusion: { label: "Weapon Fustions", items: [], dataset: { type: "fusion" } },
            upgrade: { label: "Armor Upgrades", items: [], dataset: { type: "upgrade" } },
            augmentation: { label: "Augmentations", items: [], dataset: { type: "augmentation" } }
        };

        let [items, spells, feats, classes, races] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.hasUses = item.data.uses && (item.data.uses.max > 0);
            item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
            const unusalbe = item.isOnCooldown && (item.data.uses.per && (item.data.uses.value > 0));
            item.isCharged = !unusalbe;
            if (item.type === "spell") arr[1].push(item);
            else if (item.type === "feat") arr[2].push(item);
            else if (item.type === "class") arr[3].push(item);
            else if (item.type === "race") arr[4].push(item);
            else if (Object.keys(inventory).includes(item.type)) arr[0].push(item);
            return arr;
        }, [[], [], [], [], []]);
        
        const spellbook = this._prepareSpellbook(data, spells);

        let totalWeight = 0;
        for (let i of items) {
            i.img = i.img || DEFAULT_TOKEN;

            i.data.quantity = i.data.quantity || 0;
            i.data.bulk = i.data.bulk || "-";

            let weight = 0;
            if (i.data.bulk === "L") {
                weight = 0.1;
            } else if (i.data.bulk === "-") {
                weight = 0;
            } else {
                weight = parseFloat(i.data.bulk);
            }

            i.totalWeight = i.data.quantity * weight;
            //i.hasCharges = i.type === "consumable" && i.data.charges.max > 0;
            inventory[i.type].items.push(i);
            totalWeight += i.totalWeight;
            i.totalWeight = i.totalWeight === 0.1 ? "L" : i.totalWeight === 0 ? "-" : Math.floor(i.totalWeight);
        }
        totalWeight = Math.floor(totalWeight);
        data.data.attributes.encumbrance = this._computeEncumbrance(totalWeight, data);

        const features = {
            classes: { label: "Class Levels", items: [], hasActions: false, dataset: { type: "class" }, isClass: true },
            race: { label: "Race", item: {}, hasActions: false, dataset: { type: "race" } },
            active: { label: "Active", items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
            passive: { label: "Passive", items: [], hasActions: false, dataset: { type: "feat" } }
        };

        for (let f of feats) {
            if (f.data.activation.type) features.active.items.push(f);
            else features.passive.items.push(f);
        }

        classes.sort((a, b) => b.levels - a.levels);
        features.classes.items = classes;
        features.race.item = races[0];

        data.inventory = Object.values(inventory);
        data.spellbook = spellbook;
        data.features = Object.values(features);
    }

    /**
     * Compute the level and percentage of encumbrance for an Actor.
     * 
     * @param {Number} totalWeight The cumulative item weight from inventory items
     * @param {Ojbect} actorData The data object for the Actor being rendered
     * @returns {Object} An object describing the character's encumbrance level
     * @private
     */
    _computeEncumbrance(totalWeight, actorData) {
        const enc = {
            max: actorData.data.abilities.str.value,
            value: totalWeight
        };

        enc.pct = Math.min(enc.value * 100 / enc.max, 99);
        enc.encumbered = enc.pct > (actorData.data.abilities.str.value / 2);
        return enc;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        //html.find('.toggle-prepared').click(this._onPrepareItem.bind(this));

        html.find('.short-rest').click(this._onShortRest.bind(this));
        html.find('.long-rest').click(this._onLongRest.bind(this));
    }

    /**
     * Handle toggling the prepared status of an Owned Itme within the Actor
     * 
     * @param {Event} event The triggering click event
     */
    _onPrepareItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest('.item').dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);

        return item.update({'data.preparation.prepared': !item.data.data.preparation.prepared});
    }

    /**
     * Take a short 10 minute rest, calling the relevant function on the Actor instance
     * @param {Event} event The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onShortRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.shortRest();
    }

    /**
     * Take a long rest, calling the relevant function on the Actor instance
     * @param {Event} event   The triggering click event
     * @returns {Promise}
     * @private
     */
    async _onLongRest(event) {
        event.preventDefault();
        await this._onSubmit(event);
        return this.actor.longRest();
    }
}
