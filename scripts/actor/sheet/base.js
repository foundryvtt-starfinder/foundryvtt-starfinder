class ActorSheetStarfinder extends ActorSheet {
    get actorType() {
        return this.actor.data.type;
    }

    getData() {
        const sheetData = super.getData();

        for (let skl of Object.values(sheetData.data.skills)) {
            skl.ability = sheetData.data.abilities[skl.ability].label.substring(0, 3);
            skl.icon = this._getClassSkillIcon(skl.value);
            
        }

        sheetData["actorSizes"] = CONFIG.actorSizes;
        this._prepareTraits(sheetData.data["traits"]);

        return sheetData;
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
        
        if (!this.options.editable) return;
        
        html.find('.skill-proficiency').on("click contextmenu", this._onCycleClassSkill.bind(this));
    }

    _prepareTraits(traits) {
        const map = {
            "dr": CONFIG.damageTypes,
            "di": CONFIG.damageTypes,
            "dv": CONFIG.damageTypes,
            "ci": CONFIG.damageTypes,
            "languages": CONFIG.languages
        };

        for (let [t, choices] of Object.entries(map)) {
            const trait = traits[t];
            trait.selected = trait.value.reduce((obj, t) => {
                obj[t] = choices[t];
                return obj;
            }, {});

            if (traits.custom) trait.selected["custom"] = trait.custom;
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
            field.val(levels[(idx === 0) ? levels.length - 1: idx - 1]);
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
}