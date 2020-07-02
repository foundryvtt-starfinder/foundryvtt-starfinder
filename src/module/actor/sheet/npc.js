import { ActorSheetSFRPG } from "./base.js";

/**
 * An Actor sheet for NPC type characters in the SFRPG system.
 * 
 * Extends the base ActorSheetSFRPG class.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGNPC extends ActorSheetSFRPG {
    static get defaultOptions() {
        const options = super.defaultOptions;
        mergeObject(options, {
            classes: options.classes.concat(['sfrpg', 'actor', 'sheet', 'npc']),
            width: 720,
            height: 765
        });

        return options;
    }

    get template() {
        const path = "systems/sfrpg/templates/actors/";
        if (!game.user.isGM && this.actor.limited) return path + "limited-sheet.html";
        return path + "npc-sheet.html";
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('#add-skills').click(this._toggleSkills.bind(this));
    }

    getData() {
        const data = super.getData();

        let cr = parseFloat(data.data.details.cr || 0);
        let crs = { 0: "0", 0.125: "1/8", [1/6]: "1/6", 0.25: "1/4", [1/3]: "1/3", 0.5: "1/2" };
        data.labels["cr"] = cr >= 1 ? String(cr) : crs[cr] || 1;

        return data;
    }

    /**
     * Toggle the visibility of skills on the NPC sheet.
     * 
     * @param {Event} event The originating click event
     */
    _toggleSkills(event) {
        event.preventDefault();
        
        this.actor.toggleNpcSkills();
    }

    _prepareItems(data) {
        const features = {
            weapons: { label: "Attacks", items: [], hasActions: true, dataset: { type: "weapon", "weapon-type": "natural" } },
            actions: { label: "Actions", items: [], hasActions: true, dataset: { type: "feat", "activation.type": "action" } },
            passive: { label: "Features", items: [], dataset: { type: "feat" } },
            equipment: { label: "Inventory", items: [], dataset: { type: "goods" } }
        };

        let [spells, other] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            item.isStack = item.data.quantity ? item.data.quantity > 1 : false;
            item.hasUses = item.data.uses && (item.data.uses.max > 0);
            item.hasCapacity = item.data.capacity && (item.data.capacity.max > 0);
            item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
            item.hasAttack = ["mwak", "rwak", "msak", "rsak"].includes(item.data.actionType);
            const unusable = item.isOnCooldown && (item.data.uses.per && (item.data.uses.value > 0));
            item.isCharged = !unusable;
            if (item.type === "spell") arr[0].push(item);
            else arr[1].push(item);
            return arr;
        }, [[], []]);

        // Apply item filters
        spells = this._filterItems(spells, this._filters.spellbook);
        other = this._filterItems(other, this._filters.features);

        // Organize Spellbook
        const spellbook = this._prepareSpellbook(data, spells);

        // Organize Features
        for (let item of other) {
            if (item.type === "weapon") features.weapons.items.push(item);
            else if (item.type === "feat") {
                if (item.data.activation.type) features.actions.items.push(item);
                else features.passive.items.push(item);
            }
            else if (["equipment", "consumable", "technological", "goods", "fusion", "upgrade", "augmentation"].includes(item.type)) {
                features.equipment.items.push(item);
            }
        }

        // Assign and return
        data.features = Object.values(features);
        data.spellbook = spellbook;
    }

    /**
     * This method is called upon form submission after form data is validated
     * 
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const crs = { "1/8": 0.125, "1/6": 1/6, "1/4": 0.25, "1/3": 1/3, "1/2": 0.5 };
        let crv = "data.details.cr";
        let cr = formData[crv];
        cr = crs[cr] || parseFloat(cr);
        if (cr) formData[crv] = cr < 1 ? cr : parseInt(cr);

        // Parent ActorSheet update steps
        super._updateObject(event, formData);
    }
}
