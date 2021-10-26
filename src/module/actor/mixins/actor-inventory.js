export const ActorInventoryMixin = (superclass) => class extends superclass {
    /**
     * Returns the containing item for a given item.
     * 
     * @param {Item} item Item to find the parent of.
     * @returns {Item} The parent item of the item, or null if not contained.
     */
    getContainingItem(item) {
        return this.items.find(x => x.data.data.container?.contents?.find(y => y.id === item.id) !== undefined);
    }
}
