class ActorSheetStarfinder extends ActorSheet {
    get actorType() {
        return this.actor.data.type;
    }

    getData() {
        const sheetData = super.getData();

        for (let skl of Object.values(sheetData.data.skills)) {
            skl.ability = sheetData.data.abilities[skl.ability].label.substring(0, 3);
            //skl.icon = this._getClassSkillIcon(skl.value);
            
        }

        sheetData["actorSizes"] = CONFIG.actorSizes;

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
        
    }
}