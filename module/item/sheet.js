class ItemSheetStarfinder extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.width = 620;
        options.height = 460;
        options.classes = options.classes.concat(['starfinder', 'item']);
        options.template = `public/systems/starfinder/templates/items/item-sheet.html`;
        options.resizable = true;

        return options;
    }

    getData() {
        const data = super.getData();
        data['abilities'] = game.system.template.actor.data.abilities;

        const type = this.item.type;
        mergeObject(data, {
            type: type,
            hasSidebar: true,
            sidebarTemplate: () => `public/systems/starfinder/templates/items/${type}-sidebar.html`,
            hasDetails: ["consumable", "equipment", "feat", "spell", "weapon"].includes(type),
            detailsTemplate: () => `public/systems/starfinder/templates/items/${type}-details.html`
        });

        let dt = duplicate(CONFIG.damageTypes);
        if (["spell", "feat"].includes(type)) mergeObject(dt, CONFIG.healingTypes);
        data['damageTypes'] = dt;

        if (type === 'consumable') {
            data.consumableTypes = CONFIG.consumableTypes;
        }
        else if (type === 'spell') {
            mergeObject(data, {
                spellTypes: CONFIG.spellTypes,
                spellSchools: CONFIG.spellSchools,
                spellLevels: CONFIG.spellLevels
            });
        }
        else if (this.item.type === 'weapon') {
            data.weaponTypes = CONFIG.weaponTypes;
            data.weaponProperties = this._formatWeaponProperties(data.data);
        }
        else if (type === 'feat') {
            data.featTypes = CONFIG.featTypes;
            data.featTags = [
                data.data.target.value,
                data.data.time.value
            ].filter(t => !!t);
        }
        else if (type === "equipment") {
            data.armorTypes = CONFIG.armorTypes;
        }

        return data;
    }

    _formatWeaponProperties(data) {
        if (!data.properties.value) return [];
        return data.properties.value.split(',').map(p => p.trim());
    }

    activateListeners(html) {
        super.activateListeners(html);

        new Tabs(html.find('.tabs'), {
            initial: this.item.data.flags["_sheetTab"],
            callback: clicked => this.item.data.flags["_sheetTab"] = clicked.attr('data-tab')
        });

        html.find('input[type="checkbox"]').change(event => this._onSubmit(event));
    }
}

Hooks.on('renderChatLog', (log, html, data) => ItemStarfinder.chatListeners(html));

Items.unregisterSheet('core', ItemSheet);
Items.registerSheet("starfinder", ItemSheetStarfinder, { makeDefault: true });
