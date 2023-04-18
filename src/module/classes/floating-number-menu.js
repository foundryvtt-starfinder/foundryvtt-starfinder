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
        Promise.all([
            game.settings.set("sfrpg", "floatingHP", formData["floating-toggle"]),
            game.settings.set("sfrpg", "verboseFloatyText", formData["verbose-floaty-text"]),
            game.settings.set("sfrpg", "limitByCriteria", formData["limit-by-criteria"]),
            game.settings.set("sfrpg", "minPerm", formData["min-perm"]),
            game.settings.set("sfrpg", "canSeeName", formData["can-see-name"]),
            game.settings.set("sfrpg", "canSeeBars", formData["can-see-bars"])
        ]);
    }
}
