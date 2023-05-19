import { ActorItemHelper, getChildItems } from "../../actor/actor-inventory-utils.js";

export class HotbarSFRPG extends Hotbar {
    constructor(options) {
        super(options);
    }

    get template() {
        return "systems/sfrpg/templates/ui/hotbar.hbs";
    }

    async getData() {
        const data = super.getData();

        for (const slot of data.macros) {
            const macro = slot.macro;
            if (!macro) continue;
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = deepClone(fromUuidSync(itemMacroDetails?.itemUuid));
                if (!item || !item.actor) return data;

                item.processData();

                item.macroConfig = {
                    isOnCooldown: item.system.recharge && !!item.system.recharge.value && (item.system.recharge.charged === false),
                    hasAttack: ["mwak", "rwak", "msak", "rsak"].includes(item.system.actionType) && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasDamage: item.system.damage?.parts && item.system.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasUses: item.hasUses(),
                    hasActivation: item.canBeActivated(),
                    isActive: item.isActive(),
                    hasCapacity: item.hasCapacity(),
                    greyscale: this._getGrayscaleStatus(item)
                };

                if (item.macroConfig.hasCapacity) {
                    item.macroConfig.capacityCurrent = item.getCurrentCapacity();
                    item.macroConfig.capacityMaximum = item.getMaxCapacity();
                }

                slot.tooltip += `
                    <br>
                    ${game.i18n.localize("DOCUMENT.Actor")}: ${item.actor.name}
                    <br>
                `;
                if (itemMacroDetails.macroType === "activate" && item.macroConfig.hasUses) {
                    slot.tooltip += `
                        ${game.i18n.localize("SFRPG.SpellBook.Uses")}: ${item.system.uses.value}/${item.system.uses.total}
                    `;
                } else if (itemMacroDetails.macroType === "attack" && item.macroConfig.hasCapacity) {
                    slot.tooltip += `
                        ${game.i18n.localize("SFRPG.ActorSheet.Inventory.Container.Capacity")}: ${item.macroConfig.capacityCurrent}/${item.macroConfig.capacityMaximum}
                    `;
                }

                macro.item = item;
                macro.macroType = itemMacroDetails?.macroType;

            }
        }
        return data;
    }

    _getGrayscaleStatus(item) {
        if (item.hasUses()) return !item.canBeUsed();
        else if (item.hasCapacity()) return item.getCurrentCapacity() <= 0;
        return false;
    }
}

export function listenForUpdates() {
    for (const macro of game.macros) {
        const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
        if (itemMacroDetails?.itemUuid) {
            const item = fromUuidSync(itemMacroDetails?.itemUuid);
            if (!item || !item.actor) continue;
            item.apps[ui.hotbar.appId] = ui.hotbar;

            // Attacking with a weapon with ammo triggers an update on the ammo, not the weapon, so listen to the ammo too.
            const childItems = _getChildItems(item);
            if (!childItems?.length) continue;
            for (const child of childItems) {
                child.apps[ui.hotbar.appId] = ui.hotbar;
            }

        }
    }
}

Hooks.on("preDeleteItem", (item) => {
    delete item.apps[ui.hotbar.appId];
});

Hooks.on("updateItem", (item) => {
    if (item.apps[ui.hotbar.appId]) {
        const childItems = _getChildItems(item);
        if (!childItems?.length) return;

        for (const child of childItems) {
            if (!child.apps[ui.hotbar.appId]) continue;
            child.apps[ui.hotbar.appId] = ui.hotbar;
        }
    }
});

function _getChildItems(item) {
    if (!item.requiresCapacityItem()) {
        return null;
    }

    // Create actor item helper
    const tokenId = item.actor.isToken ? item.actor.token.id : null;
    const sceneId = item.actor.isToken ? item.actor.token.parent.id : null;
    // Pass the actor through on the options object so the constructor doesn't have to try (and fail) and fetch the actor from the compendium.
    const itemHelper = new ActorItemHelper(item.actor.id, tokenId, sceneId, { actor: item.actor });

    const childItems = getChildItems(itemHelper, item);
    return childItems;

}
