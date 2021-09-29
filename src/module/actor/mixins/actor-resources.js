export const ActorResourcesMixin = (superclass) => class extends superclass {
    getResourceBaseValue(type, subType) {
        const actorResource = this.getResource(type, subType);
        if (actorResource) {
            return actorResource.base;
        }
        return null;
    }

    async setResourceBaseValue(type, subType, value) {
        const actorResource = this.getResource(type, subType);
        if (actorResource) {
            if (actorResource.data.data.range.min || actorResource.data.data.range.min === 0) {
                value = Math.max(value, actorResource.data.data.range.min);
            }
            if (actorResource.data.data.range.max || actorResource.data.data.range.max === 0) {
                value = Math.min(value, actorResource.data.data.range.max);
            }
            return actorResource.update({
                'data.base': value
            });
        }
        return null;
    }

    getResourceComputedValue(type, subType) {
        if (this.data.data.resources) {
            const typeMap = this.data.data.resources[type];
            if (typeMap) {
                const subTypeData = typeMap[subType];
                if (subTypeData) {
                    return subTypeData.value;
                }
            }
        }
        return null;
    }

    getResource(type, subType) {
        if (!type || !subType) {
            return null;
        }

        const conditionItems = this.items.filter(x => x.type === "actorResource" && x.data.data.type === type && x.data.data.subType === subType);
        if (conditionItems.length > 1) {
            ui.notifications.warn(`Found multiple actorResources matching ${type}.${subType} on actor ${this.name}, returning the first one.`);
        }
        return conditionItems[0];
    }

    getResourcesForCombatTracker() {
        const actorResources = this.items.filter(x => x.type === "actorResource" && x.data.data.combatTracker?.show);
        return actorResources;
    }
}
