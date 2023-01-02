export default class FloatingNumberMenu extends FormApplication {
    constructor(...args) {
        super(...args);
    }

    getData() {
        let data = super.getData();
        data.perms = {
            "LIMITED": "OWNERSHIP.LIMITED",
            "OBSERVER": "OWNERSHIP.OBSERVER",
            "OWNER": "OWNERSHIP.OWNER"
        };

        data.floatingToggle = game.settings.get("sfrpg", "floatingHP");
        data.verboseFloatyText = game.settings.get("sfrpg", "verboseFloatyText");
        data.limitByCriteria = game.settings.get("sfrpg", "limitByCriteria");
        data.minPerm = game.settings.get("sfrpg", "minPerm");
        data.canSeeName = game.settings.get("sfrpg", "canSeeName");
        data.canSeeBars = game.settings.get("sfrpg", "canSeeBars");

        return data;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: `systems/sfrpg/templates/apps/floatinghp.hbs`,
            id: 'floating-hp',
            title: 'SFRPG.Settings.FloatingHP.Menu.Label',
            width: 600
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        await game.settings.set("sfrpg", "floatingHP", formData["floating-toggle"]);
        await game.settings.set("sfrpg", "verboseFloatyText", formData["verbose-floaty-text"]);
        await game.settings.set("sfrpg", "limitByCriteria", formData["limit-by-criteria"]);
        await game.settings.set("sfrpg", "minPerm", formData["min-perm"]);
        await game.settings.set("sfrpg", "canSeeName", formData["can-see-name"]);
        await game.settings.set("sfrpg", "canSeeBars", formData["can-see-bars"]);
    }
}
