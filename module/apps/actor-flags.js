export class ActorSheetFlags extends BaseEntitySheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return mergeObject(options, {
            id: "actor-flags",
            classes: ["starfinder"],
            template: "systems/starfinder/templates/apps/actor-flags.html",
            width: 500,
            closeOnSubmit: true
        });
    }

    get title() {
        return `${game.i18n.localize('STARFINDER.FlagsTitle')}: ${this.object.name}`;
    }

    getData() {
        const data = super.getData();
        data.flags = this._getFlags();

        return data;
    }

    _getFlags() {
        const flags = {};
        for (let [k, v] of Object.entries(CONFIG.STARFINDER.characterFlags)) {
            if (!flags.hasOwnProperty(v.section)) flags[v.section] = {};
            let flag = duplicate(v);
            flag.type = v.type.name;
            flag.isCheckbox = v.type === Boolean;
            flag.isSelect = v.hasOwnProperty('choices');
            flag.value = this.entity.getFlag("starfinder", k);
            flags[v.section][k] = flag;
        }

        return flags;
    }

    _updateObject(event, formData) {
        const actor = this.object;
        const flags = duplicate(actor.data.flags.starfinder || {});

        for (let [k, v] of Object.entries(CONFIG.STARFINDER.characterFlags)) {
            if ([undefined, null, "", false].includes(formData[k])) delete flags[k];
            else if ((v.type === Number) && (formData[k] === 0)) delete flags[k];
            else flags[k] = formData[k];
        }

        actor.update({'flags.starfinder': flags});
    }
}