
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
                    hasCapacity: item.hasCapacity()

                };

                if (item.macroConfig.hasCapacity) {
                    item.macroConfig.capacityCurrent = item.getCurrentCapacity();
                    item.macroConfig.capacityMaximum = item.getMaxCapacity();
                }

                slot.iconClass = this._getIcon(item.macroConfig, itemMacroDetails.macroType);
                slot.greyscale = this._getGreyscaleStatus(item, itemMacroDetails.macroType);

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

    _getIcon(macroConfig, macroType) {
        if (macroType === "attack") return "fa-hand-fist";
        else if (macroType === "damage")  return "fa-burst";
        else if (macroType === "reload")  return "fa-redo";
        else if (macroType === "activate") {
            if (macroConfig.hasActivation) {
                if (macroConfig.isActive) return "fa-check";
                else return "fa-xmark";
            }
        }

    }

    _getGreyscaleStatus(item, macroType) {
        if (!["activate", "attack", "use", "healing"].includes(macroType)) return false;

        if (item.hasCapacity()) return item.getCurrentCapacity() <= 0;
        else if (item.hasUses()) return !item.canBeUsed();
        return false;
    }
}

Hooks.on("getHotbarEntryContext", (element, li) => {
    const viewActor = {
        name: "SFRPG.Macro.ViewActor",
        icon: "<i class=\"fas fa-user\"></i>",
        condition: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                return !!item?.actor;
            }
        },
        callback: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                item?.actor.sheet.render(true);
            }
        }
    };

    const viewItem = {
        name: "SFRPG.Macro.ViewItem",
        icon: "<i class=\"fas fa-suitcase\"></i>",
        condition: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                return !!fromUuidSync(itemMacroDetails?.itemUuid);
            }
        },
        callback: (li) => {
            const macro = game.macros.get(li.data("macro-id"));
            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                item.sheet.render(true);
            }
        }
    };

    li.push(viewActor, viewItem);
});
