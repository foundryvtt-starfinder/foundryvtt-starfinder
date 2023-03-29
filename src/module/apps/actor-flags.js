export class ActorSheetFlags extends DocumentSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return mergeObject(options, {
            id: "actor-flags",
            classes: ["sfrpg"],
            template: "systems/sfrpg/templates/apps/actor-flags.hbs",
            width: 500,
            closeOnSubmit: true
        });
    }

    get title() {
        return `${game.i18n.localize('SFRPG.FlagsTitle')}: ${this.object.name}`;
    }

    getData() {
        const data = super.getData();
        data.flags = this._getFlags();

        return data;
    }

    _getFlags() {
        const flags = {};
        for (let [k, v] of Object.entries(CONFIG.SFRPG.characterFlags)) {
            if (!flags.hasOwnProperty(v.section)) flags[v.section] = {};
            let flag = deepClone(v);
            flag.type = v.type.name;
            flag.isCheckbox = v.type === Boolean;
            flag.isSelect = v.hasOwnProperty('choices');
            flag.value = this.document.getFlag("sfrpg", k);
            flags[v.section][k] = flag;
        }

        return flags;
    }

    _updateObject(event, formData) {
        const actor = this.object;

        const updateData = {};
        for (let [k, v] of Object.entries(CONFIG.SFRPG.characterFlags)) {
            if ([undefined, null, "", false].includes(formData[k])) updateData[`-=${k}`] = null;
            else if ((v.type === Number) && (formData[k] === 0)) updateData[`-=${k}`] = null;
            else updateData[k] = formData[k];
        }

        actor.update({'flags.sfrpg': updateData});
    }
}
