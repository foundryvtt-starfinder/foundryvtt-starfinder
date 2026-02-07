import AbilityTemplate from "../../canvas/ability-template.js";
import {ItemSFRPG} from "../item.js";
import RollContext from "../../rolls/rollcontext.js";

/**
 * @import { ActorSFRPG } from "../../actor/actor.js"
 */

export const ItemChatMixin = (superclass) => class extends superclass {

    static chatListeners(html) {
        html.on('click', '.chat-card .card-buttons button', this._onChatCardAction.bind(this));
        html.on('click', '.chat-card .item-name', this._onChatCardToggleContent.bind(this));
    }

    static async _onChatCardAction(event) {
        event.preventDefault();

        // Extract card data
        const button = event.currentTarget;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        const action = button.dataset.action;
        const dc = button.dataset.dc ? Number(button.dataset.dc) : undefined;

        // Validate permission to proceed with the roll
        const isTargetted = ["save", "skill"].includes(action);
        if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

        // Get the Actor from a synthetic Token
        const chatCardActor = this._getChatCardActor(card);
        if (!chatCardActor) {
            ui.notifications.error("SFRPG.ChatCard.ItemAction.NoActor");
            return;
        }

        // Get the Item
        let item = chatCardActor.items.get(card.dataset.itemId);

        // Adjust item to level, if required
        if (Object.keys(message.flags?.sfrpg ?? {}).length !== 0 && message.flags?.sfrpg?.level !== item.system.level) {
            const newItemData = item.toObject();
            newItemData.system.level = message.flags.sfrpg.level;

            item = new ItemSFRPG(newItemData, {parent: item.parent});

            // Run automation to ensure save DCs are correct.
            item.prepareData();
            const processContext = await item.processData();
            if (processContext.fact.promises) {
                await Promise.all(processContext.fact.promises);
            }
        }

        // Get the target
        const targetActor = isTargetted ? this._getChatCardTarget(card) : null;

        // Attack and Damage Rolls
        if (action === "attack") await item.rollAttack({ event });
        else if (action === "damage") await item.rollDamage({ event });
        else if (action === "formula") await item.rollFormula({ event });
        else if (action === "template") await item.placeAbilityTemplate({ event });

        // Skill Check
        else if (action === "skill" && targetActor) await targetActor.rollSkill(button.dataset.type, { event, dc });

        // Saving Throw
        else if (action === "save" && targetActor) await targetActor.rollSave(button.dataset.type, { event, dc });

        // Item capacity and consumable usage
        else if (action === "use") await item.useItem({ event });
    }

    /**
     * Handle toggling the visibility of chat card content when the name is clicked.
     * @param {Event} event The originating click event
     */
    static _onChatCardToggleContent(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const card = header.closest('.chat-card');
        const content = card.querySelector('.card-content');
        // content.style.display = content.style.display === 'none' ? 'block' : 'none';
        $(content).slideToggle();
    }

    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {?ActorSFRPG}         The Actor entity or null
     * @private
     */
    static _getChatCardActor(card) {

        const actorId = card.dataset.actorId;

        // Case 1 - a synthetic actor from a Token, legacy reasons the token Id can be a compound key of sceneId and tokenId
        let tokenId = card.dataset.tokenId;
        let sceneId = card.dataset.sceneId;
        if (!sceneId && tokenId?.includes('.')) {
            [sceneId, tokenId] = tokenId.split(".");
        }

        let chatCardActor = null;
        if (tokenId && sceneId) {
            const scene = game.scenes.get(sceneId);
            if (scene) {
                const tokenData = scene.getEmbeddedDocument("Token", tokenId);
                if (tokenData) {
                    const token = new foundry.canvas.placeables.Token(tokenData);
                    chatCardActor = token.actor;
                }
            }
        }

        // Case 2 - use Actor ID directory
        if (!chatCardActor) {
            chatCardActor = game.actors.get(actorId);
        }

        return chatCardActor;
    }

    /**
     * Get the Actor which is the author of a chat card
     * @return {?ActorSFRPG}         The Actor entity or null
     * @private
     */
    static _getChatCardTarget() {
        const character = game.user.character;
        const controlled = canvas.tokens?.controlled;
        if (controlled.length === 0) return character || null;
        if (controlled.length === 1) return controlled[0].actor;
        else throw new Error(`You must designate a specific Token as the roll target`);
    }

    async placeAbilityTemplate() {
        const itemData = this.system;

        const type = {
            "sphere": "circle",
            "cone": "cone",
            "cube": "rect",
            "cylinder": "circle",
            "line": "ray"
        }[itemData?.area?.shape] || null;

        if (!type) return;

        const template = AbilityTemplate.fromData({
            type: type || "circle",
            distance: this.system?.area?.total || this.system?.area?.value || 0
        });

        if (!template) return;

        const placed = await template.drawPreview();
        if (placed) template.place(); // If placement is confirmed
        return placed;

    }

    /**
     * Prepare this item's description, and chat message properties.
     * @returns {Object} An object containing the item's rollData (including its owners), and chat message properties.
     */
    async getChatData() {
        const data = this.system;
        const labels = this.labels;

        const async = true;
        const secrets = this.isOwner;
        const rollData = RollContext.createItemRollContext(this, this.actor).getRollData();

        // Rich text description
        if (data.description.short) data.description.short = await foundry.applications.ux.TextEditor.enrichHTML(data.description.short, {
            async,
            secrets,
            rollData
        });
        data.description.value = await foundry.applications.ux.TextEditor.enrichHTML(data.description.value, {
            async,
            secrets,
            rollData
        });

        // Item type specific properties
        /** @type {{name: string, tooltip: ?string, title: ?string}[]} */
        const props = [];
        const fn = this[`_${this.type}ChatData`];
        if (fn) fn.bind(this)(data, labels, props);

        // General equipment properties
        const equippableTypes = ["weapon", "equipment", "shield"];
        if (data.hasOwnProperty("equipped") && equippableTypes.includes(this.type)) {
            props.push(
                {
                    name: data.equipped
                        ? game.i18n.localize("SFRPG.InventoryEquipped")
                        : game.i18n.localize("SFRPG.InventoryNotEquipped"),
                    tooltip: null
                },
                {
                    name: data.proficient
                        ? game.i18n.localize("SFRPG.Items.Proficient")
                        : game.i18n.localize("SFRPG.Items.NotProficient"),
                    tooltip: null
                }
            );
        }

        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            if (data.activation.type && data.activation.type !== "none") props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Activation"), name: labels.activation, tooltip: null }
            );
            if (data.target.value) props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Target"), name: labels.target, tooltip: null }
            );
            if ((data.range.value || data.range.total) && data.range.units !== "none") {
                const rangeTooltip = ["close", "medium", "long"].includes(data.range.units)
                    ? game.i18n.format(`SFRPG.Range${data.range.units.capitalize()}`)
                    : null;
                props.push(
                    { title: game.i18n.localize(`SFRPG.Items.Activation.Range${this.type === "weapon" ? "Increment" : ""}`), name: labels.range, tooltip: rangeTooltip }
                );
            }
            if (data.area.value || data.area.total) props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Area"), name: labels.area, tooltip: null }
            );
            if (data.duration.value || data.duration.total) props.push(
                { title: game.i18n.localize("SFRPG.Items.Activation.Duration"), name: labels.duration, tooltip: null }
            );
        }

        if (data.hasOwnProperty("capacity")) {
            props.push({
                name: labels.capacity,
                tooltip: null
            });
        }

        if (this.type === "container") {
            if (this.actor) {
                const wealthString = new Intl.NumberFormat(game.i18n.lang).format(Math.floor(this.contentWealth));
                const wealthProperty = game.i18n.format("SFRPG.CharacterSheet.Inventory.ContainedWealth", {wealth: wealthString});
                props.push({
                    name: wealthProperty,
                    tooltip: null
                });
            }
        }

        // Filter properties and return
        data.chatProperties = props.filter(p => !!p?.name);
        return data;
    }

    _getContainedItems() {
        const contents = this.system.container?.contents;
        if (!contents || !this.actor) {
            return [];
        }

        const itemsToTest = [this];
        const containedItems = [];
        while (itemsToTest.length > 0) {
            const itemToTest = itemsToTest.shift();

            const contents = itemToTest?.system?.container?.contents;
            if (contents) {
                for (const content of contents) {
                    const containedItem = this.actor.items.get(content.id);
                    if (containedItem) {
                        containedItems.push(containedItem);
                        itemsToTest.push(containedItem);
                    }
                }
            }
        }

        return containedItems;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for equipment type items
     * @private
     */
    _equipmentChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.armorTypes[data.armor.type], tooltip: null},
            {name: labels.eac || null, tooltip: null},
            {name: labels.kac || null, tooltip: null}
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for weapon type items
     * @private
     */
    _weaponChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.weaponTypes[data.weaponType], tooltip: null},
            ...Object.entries(data.properties).filter(e => e[1].value === true)
                .map(e => ({name: CONFIG.SFRPG.weaponProperties[e[0]], tooltip: CONFIG.SFRPG.weaponPropertiesTooltips[e[0]]})
                )
        );
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for consumable type items
     * @private
     */
    _consumableChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.consumableTypes[data.consumableType], tooltip: null},
            {name: this.getRemainingUses() + "/" + this.getMaxUses() + ` ${game.i18n.localize("SFRPG.FeaturesCharges")}`, tooltip: null}
        );
        data.hasCharges = this.getRemainingUses() >= 0;
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for goods type items
     * @private
     */
    _goodsChatData(data, labels, props) {
        props.push(
            {name: CONFIG.SFRPG.itemTypes["goods"], tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for technological type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _technologicalChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.technological"), tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `${game.i18n.localize("SFRPG.Items.Description.Hands")} ${data.hands}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for hybrid type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _hybridChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.hybrid"), tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `${game.i18n.localize("SFRPG.Items.Description.Hands")} ${data.hands}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for magic type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _magicChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.magic"), tooltip: null},
            data.bulk ? {name: `${game.i18n.localize("SFRPG.InventoryBulk")} ${data.bulk}`, tooltip: null} : null,
            data.hands ? {name: `${game.i18n.localize("SFRPG.Items.Description.Hands")} ${data.hands}`, tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for armor upgrades
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _upgradeChatData(data, labels, props) {
        let allowedArmorType = "";

        if (data.allowedArmorType === 'any') {
            allowedArmorType = game.i18n.localize("SFRPG.Any");
        } else {
            allowedArmorType = CONFIG.SFRPG.allowedArmorTypes[data.allowedArmorType];
        }

        props.push(
            {name: game.i18n.localize("TYPES.Item.upgrade"), tooltip: null},
            data.slots ? {name: `${game.i18n.localize("SFRPG.Items.Upgrade.Slots")} ${data.slots}`, tooltip: null} : null,
            {name: `${game.i18n.localize("SFRPG.Items.Upgrade.AllowedArmorType")}: ${allowedArmorType}`, tooltip: null}
        );
    }

    _augmentationChatData(data, labels, props) {
        props.push(
            {name:game.i18n.localize("TYPES.Item.augmentation"), tooltip: null},
            data.type ? {name: CONFIG.SFRPG.augmentationTypes[data.type], tooltip: null} : null,
            data.system ? {name: CONFIG.SFRPG.augmentationSystems[data.system], tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for weapon fusions
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _fusionChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.fusion"), tooltip: null},
            data.level ? {name: `${game.i18n.localize("SFRPG.LevelLabelText")} ${data.level}`, tooltip: null} : null
        );
    }

    _starshipWeaponChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.starshipWeapon"), tooltip: null},
            data.weaponType ? {name: CONFIG.SFRPG.starshipWeaponTypes[data.weaponType], tooltip: null} : null,
            data.class ? {name: CONFIG.SFRPG.starshipWeaponClass[data.class], tooltip: null} : null,
            data.range ? {name: CONFIG.SFRPG.starshipWeaponRanges[data.range], tooltip: null} : null,
            data.mount.mounted ? {name: game.i18n.localize("SFRPG.Items.ShipWeapon.Mounted"), tooltip: null} : {name: game.i18n.localize("SFRPG.Items.ShipWeapon.NotMounted"), tooltip: null},
            data.speed > 0 ? {name: game.i18n.format("SFRPG.Items.ShipWeapon.Speed", {speed: data.speed}), tooltip: null} : null
        );
    }

    /**
     * Prepare chat card data for shield type items
     * @param {Object} data The items data
     * @param {Object} labels Any labels for the item
     * @param {Object} props The items properties
     */
    _shieldChatData(data, labels, props) {
        const wieldedBonus = (data.proficient ? data.bonus.wielded : 0) || 0;
        const alignedBonus = (data.proficient ? data.bonus.aligned : 0) || 0;

        props.push(
            { name: game.i18n.localize("SFRPG.Items.Shield.Shield"), tooltip: null },
            {
                title: game.i18n.localize("SFRPG.Items.Shield.AcMaxDexLabel"),
                name: (data.dex || 0).signedString(),
                tooltip: null
            },
            {
                title: game.i18n.localize("SFRPG.Items.Shield.ArmorCheckLabel"),
                name: (data.acp || 0).signedString(),
                tooltip: null
            },
            {
                title: game.i18n.localize("SFRPG.Items.Shield.Bonus"),
                name: game.i18n.format("SFRPG.Items.Shield.Bonuses", {
                    wielded: wieldedBonus.signedString(),
                    aligned: alignedBonus.signedString()
                }),
                tooltip: null
            },
            data.proficient
                ? { name: game.i18n.localize("SFRPG.Items.Proficient"), tooltip: null }
                : { name: game.i18n.localize("SFRPG.Items.NotProficient"), tooltip: null }
        );
    }

    /* -------------------------------------------- */

    /**
     * Render a chat card for Spell type data
     * @return {Object}
     * @private
     */
    _spellChatData(data, labels, props) {

        // Spell properties
        props.push(
            {name: labels.level, tooltip: null}
        );

        // Spell school
        if (CONFIG.SFRPG.spellSchools[data.school]) {
            props.push(
                {name: game.i18n.localize(SFRPG.spellSchools[data.school]), tooltip: null}
            );
        }
    }

    /* -------------------------------------------- */

    /**
     * Prepare chat card data for items of the "Feat" type
     */
    _featChatData(data, labels, props) {
        // Feat properties
        props.push(
            {name: data.requirements, tooltip: null}
        );
    }

    _themeChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.theme"), tooltip: null},
            data.abilityMod.ability ? {name: `Ability ${CONFIG.SFRPG.abilities[data.abilityMod.ability]}`, tooltip: null} : null,
            data.skill ? {name: `Skill ${CONFIG.SFRPG.skills[data.skill]}`, tooltip: null} : null
        );
    }

    _raceChatData(data, labels, props) {
        props.push(
            {name: game.i18n.localize("TYPES.Item.race"), tooltip: null},
            data.type ? {name: data.type, tooltip: null} : null,
            data.subtype ? {name: data.subtype, tooltip: null} : null
        );
    }

    _vehicleAttackChatData(data, label, props) {
        props.push(
            data.ignoresHardness ? game.i18n.localize("SFRPG.VehicleAttackSheet.Details.IgnoresHardness") + " " + data.ignoresHardness : null
        );
    }

    _vehicleSystemChatData(data, label, props) {

        if (data.senses &&  data.senses.usedForSenses) {
            // We deliminate the senses by `,` and present each sense as a separate property
            const sensesDeliminated = data.senses.senses.split(",");
            for (let index = 0; index < sensesDeliminated.length; index++) {
                const sense = sensesDeliminated[index];
                props.push(sense);
            }
        }
    }
};
