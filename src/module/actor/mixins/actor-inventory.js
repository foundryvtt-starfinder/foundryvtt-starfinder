export const ActorInventoryMixin = (superclass) => class extends superclass {
    /**
     * Returns the containing item for a given item.
     *
     * @param {Item} item Item to find the parent of.
     * @returns {Item} The parent item of the item, or null if not contained.
     */
    getContainingItem(item) {
        return this.items.find(x => x.system.container?.contents?.find(y => y.id === item.id) !== undefined);
    }

    /**
     * Processes all the item data for this actor, running any automation.
     */
    async processItemData() {
        const actor = this;
        if (actor.items.size > 0) {
            Hooks.callAll("beforeItemsProcessed", {actor: actor});

            const promises = [];
            for (const item of actor.items) {
                const itemProcess = item.processData();
                promises.push(itemProcess);
            }

            // Wait a moment to allow the database to update.
            Promise.all(promises).then(x => { return new Promise(resolve => setTimeout(() => resolve(x), 1)); })
                .then(() => {
                    Hooks.callAll("afterItemsProcessed", {actor: actor});
                    if (actor.sheet?.rendered) {
                        actor.sheet?.clearTooltips();
                        actor.sheet?.render(false);
                    }
                });
        }
    }
};
