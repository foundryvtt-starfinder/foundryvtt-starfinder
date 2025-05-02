
export class HotbarSFRPG extends foundry.applications.ui.Hotbar {
    constructor(options) {
        super(options);
    }

    /** @override */
    static PARTS = {
        hotbar: {
            root: true,
            template: "systems/sfrpg/templates/ui/hotbar.hbs"
        }
    };

    /** @override */
    async _prepareContext() {
        const data = await super._prepareContext();

        for (const slot of data.macros) {
            const macro = slot.macro;
            if (!macro) continue;

            const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
            if (itemMacroDetails?.itemUuid) {
                const item = fromUuidSync(itemMacroDetails?.itemUuid);
                if (!item || !item.actor) continue;

                await item.processData();

                const macroConfig = {
                    item,
                    isOnCooldown: item.system.recharge && !!item.system.recharge.value && (item.system.recharge.charged === false),
                    hasAttack: ["mwak", "rwak", "msak", "rsak"].includes(item.system.actionType) && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasDamage: item.system.damage?.parts && item.system.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasUses: item.hasUses(),
                    hasActivation: item.canBeActivated(),
                    isActive: item.isActive(),
                    hasCapacity: item.hasCapacity()

                };

                if (macroConfig.hasCapacity) {
                    macroConfig.capacityCurrent = item.getCurrentCapacity();
                    macroConfig.capacityMaximum = item.getMaxCapacity();
                }

                slot.iconClass = this._getIcon(macroConfig, itemMacroDetails.macroType);
                slot.greyscale = this._getGreyscaleStatus(item, itemMacroDetails.macroType);
                slot.hasCapacity = itemMacroDetails.macroType === "attack" && macroConfig.hasCapacity;
                slot.activeGlow = itemMacroDetails.macroType === "activate" && macroConfig.isActive;
                slot.hasUses = itemMacroDetails.macroType === "activate" && macroConfig.hasUses;

                slot.tooltip += `
                    <br>
                    ${game.i18n.localize("DOCUMENT.Actor")}: ${item.actor.name}
                    <br>
                `;
                if (itemMacroDetails.macroType === "activate") {
                    slot.tooltip += macroConfig.isActive ? "Active" : "Inactive";
                    slot.tooltip += "<br>";
                    if (macroConfig.hasUses) slot.tooltip += `
                        ${game.i18n.localize("SFRPG.SpellBook.Uses")}: ${item.system.uses.value}/${item.system.uses.total}
                    `;
                } else if (itemMacroDetails.macroType === "attack" && macroConfig.hasCapacity) {
                    slot.tooltip += `
                        ${game.i18n.localize("SFRPG.ActorSheet.Inventory.Container.Capacity")}: ${macroConfig.capacityCurrent}/${macroConfig.capacityMaximum}
                    `;
                }

                macro.macroConfig = macroConfig;
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
