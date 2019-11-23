import { TraitSelectorStarfinder } from "../../apps/trait-selector.js";
import { ActorSheetFlags } from "../../apps/actor-flags.js";

/**
 * Extend the basic ActorSheet class to do all the Starfinder things!
 * This sheet is an Abstract layer which is not used.
 * 
 * @type {ActorSheet}
 */
export class ActorSheetStarfinder extends ActorSheet {
    constructor(...args) {
        super(...args);

        this._filters = {
            inventory: new Set(),
            spellbook: new Set(),
            features: new Set()
        };
    }

    /**
     * Add some extra data when rendering the sheet to reduce the amount of logic required within the template.
     */
    getData() {
        let isOwner = this.entity.owner;
        const data = {
            owner: isOwner,
            limited: this.entity.limited,
            options: this.options,
            editable: this.isEditable,
            cssClass: isOwner ? "editable" : "locked",
            isCharacter: this.entity.data.type === "character",
            config: CONFIG.STARFINDER
        };

        data.actor = duplicate(this.actor.data);
        data.items = this.actor.items.map(i => {
            i.data.labels = i.lables;
            return i.data;
        });
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        data.data = data.actor.data;
        data.labels = this.actor.labels || {};
        data.filters = this._filters;
        
        // Ability Scores
        for (let [a, abl] of Object.entries(data.actor.data.abilities)) {
            abl.label = CONFIG.STARFINDER.abilities[a];
        }

        // Update skill labels
        for (let [s, skl] of Object.entries(data.actor.data.skills)) {
            skl.ability = data.actor.data.abilities[skl.ability].label.substring(0, 3);
            skl.icon = this._getClassSkillIcon(skl.value);
            skl.label = CONFIG.STARFINDER.skills[s];
        }
        
        this._prepareTraits(data.actor.data.traits);

        this._prepareItems(data);

        return data;
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     * 
     * @param {HTML} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('[data-wpad]').each((i, e) => {
            let text = e.tagName === "INPUT" ? e.value : e.innerText,
                w = text.length * parseInt(e.getAttribute("data-wpad")) / 2;
            e.setAttribute("style", "flex: 0 0 " + w + "px;");
        });

        html.find('.tabs').each((_, el) => {
            let tabs = $(el),
                group = el.getAttribute("data-group"),
                initial = this.actor.data.flags[`_sheetTab-${group}`];
            new Tabs(tabs, {
                initial: initial,
                callback: clicked => this.actor.data.flags[`_sheetTab-${group}`] = clicked.attr("data-tab")
            });
        });

        html.find('.item .item-name h4').click(event => this._onItemSummary(event));

        if (!this.options.editable) return;

        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
        html.find('.trait-selector').click(ev => this._onTraitSelector(ev));
    }

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.STARFINDER.damageTypes,
            "di": CONFIG.STARFINDER.damageTypes,
            "dv": CONFIG.STARFINDER.damageTypes,
            "ci": CONFIG.STARFINDER.damageTypes,
            "languages": CONFIG.STARFINDER.languages,
            "weaponProf": CONFIG.STARFINDER.weaponProficiencies,
            "armorProf": CONFIG.STARFINDER.armorProficiencies
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            if (!trait) continue;
            let values = [];
            if (trait.value) {
                values = trait.value instanceof Array ? trait.value : [trait.value];
            }
            trait.selected = values.reduce((obj, t) => {
                obj[t] = choices[t];
                return obj;
            }, {});

            if (trait.custom) {
                trait.custom.split(';').forEach((c, i) => trait.selected[`custom${i+1}`] = c.trim());
            }
            trait.cssClass = !isObjectEmpty(trait.selected) ? "" : "inactive";
        }
    }

    /**
     * handle cycling whether a skill is a class skill or not
     * 
     * @param {Event} event A click or contextmenu event which triggered the handler
     * @private
     */
    _onCycleClassSkill(event) {
        event.preventDefault();

        const field = $(event.currentTarget).siblings('input[type="hidden"]');

        const level = parseFloat(field.val());
        const levels = [0, 3];

        let idx = levels.indexOf(level);

        if (event.type === "click") {
            field.val(levels[(idx === levels.length - 1) ? 0 : idx + 1]);
        } else if (event.type === "contextmenu") {
            field.val(levels[(idx === 0) ? levels.length - 1 : idx - 1]);
        }

        this._onSubmit(event);
    }

    /**
     * Get The font-awesome icon used to display if a skill is a class skill or not
     * 
     * @param {Number} level Flag that determines if a skill is a class skill or not
     * @returns {String}
     * @private
     */
    _getClassSkillIcon(level) {
        const icons = {
            0: '<i class="far fa-circle"></i>',
            3: '<i class="fas fa-check"></i>'
        };

        return icons[level];
    }

    /**
     * Handle rolling of an item form the Actor sheet, obtaining the item instance an dispatching to it's roll method.
     * 
     * @param {Event} event The html event
     */
    _onItemSummary(event) {
        event.preventDefault();
        let li = $(event.currentTarget).parents('.item'),
            item = this.actor.getOwnedItem(Number(li.attr('data-item-id'))),
            chatData = item.getChatData({ secrets: this.actor.owner });

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

    _prepareSpellbook(data, spells) {

    }

    /**
     * Creates an TraitSelectorStarfinder dialog
     * 
     * @param {Event} event HTML Event
     * @private
     */
    _onTraitSelector(event) {
        event.preventDefault();
        let a = $(event.currentTarget);
        const options = {
            name: a.parents('label').attr('for'),
            title: a.parent().text().trim(),
            choices: CONFIG[a.attr('data-options')]
        };

        new TraitSelectorStarfinder(this.actor, options).render(true);
    }
}