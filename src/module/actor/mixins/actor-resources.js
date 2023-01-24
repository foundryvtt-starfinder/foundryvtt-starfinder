export const ActorResourcesMixin = (superclass) => class extends superclass {
    getResourceBaseValue(type, subType) {
        const actorResource = this.getResource(type, subType);
        if (actorResource) {
            return actorResource.system.base;
        }
        return null;
    }

    async setResourceBaseValue(type, subType, value) {
        const actorResource = this.getResource(type, subType);
        if (actorResource) {
            if (actorResource.system.range.min || actorResource.system.range.min === 0) {
                value = Math.max(value, actorResource.system.range.min);
            }
            if (actorResource.system.range.max || actorResource.system.range.max === 0) {
                value = Math.min(value, actorResource.system.range.max);
            }
            return actorResource.update({
                'system.base': value
            });
        }
        return null;
    }

    getResourceComputedValue(type, subType) {
        if (this.system.resources) {
            const typeMap = this.system.resources[type];
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

        const conditionItems = this.items.filter(x => x.type === "actorResource" && x.system.type === type && x.system.subType === subType);
        if (conditionItems.length > 1) {
            ui.notifications.warn(`Found multiple actorResources matching ${type}.${subType} on actor ${this.name}, returning the first one.`);
        }
        return conditionItems[0];
    }

    getResourcesForCombatTracker() {
        const actorResources = this.items.filter(x => x.type === "actorResource" && x.system.combatTracker?.show);
        return actorResources;
    }
};
