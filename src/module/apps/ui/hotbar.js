/**
 * @import { ActorSFRPG } from '../../actor/actor.js'
 */

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
        for (const slot of data.slots) {
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
                    hasAttack: CONFIG.SFRPG.attackActions.includes(item.system.actionType) && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasDamage: item.system.damage?.parts && item.system.damage.parts.length > 0 && (!["weapon", "shield"].includes(item.type) || item.system.equipped),
                    hasUses: item.hasUses(),
                    hasActivation: item.canBeActivated() && item.system.duration?.units !== 'instantaneous',
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

                slot.tooltip = `<strong>${slot.tooltip}</strong>`;
                slot.tooltip += `
                    <br>
                    ${game.i18n.localize("DOCUMENT.Actor")}: ${item.actor.name}
                    <br>
                `;
                if (itemMacroDetails.macroType === "activate") {
                    if (macroConfig.hasActivation) {
                        slot.tooltip += macroConfig.isActive ? game.i18n.localize("SFRPG.Macro.Active") : game.i18n.localize("SFRPG.Macro.Inactive");
                        slot.tooltip += "<br>";
                    }
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

    /**
     * Stop the hotbar closing if an item with an item macro is deleted
     * @inheritdoc
     */
    async close(options = {}) {
        if (options?.renderData instanceof Item) return;

        return super.close(options);
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

    /**
     * A helper method used to retrieve a Macro document from a hotbar slot element.
     * @param {HTMLLIElement} element
     * @returns {?foundry.documents.Macro}
     */
    #getMacroForSlot(element) {
        const slot = element.dataset.slot;
        const macroId = game.user.hotbar[slot];
        if ( !macroId) return null;
        return game.macros.get(macroId) ?? null;
    }

    /**
     * @inheritdoc
     */
    _getContextMenuOptions() {
        const options = super._getContextMenuOptions();

        return options.concat([
            {
                name: "SFRPG.Macro.ViewActor",
                icon: "<i class=\"fas fa-user\"></i>",
                condition: (li) => Boolean(findActorSync(this.#getMacroForSlot(li))),
                callback: (li) => findActorSync(this.#getMacroForSlot(li))?.sheet.render(true)

            },
            {
                name: "SFRPG.Macro.ViewItem",
                icon: "<i class=\"fas fa-suitcase\"></i>",
                condition: (li) => {
                    const macro = this.#getMacroForSlot(li);
                    const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
                    if (itemMacroDetails?.itemUuid) {
                        return !!fromUuidSync(itemMacroDetails?.itemUuid);
                    }
                },
                callback: (li) => {
                    const macro = this.#getMacroForSlot(li);
                    const itemMacroDetails = macro?.flags?.sfrpg?.itemMacro;
                    if (itemMacroDetails?.itemUuid) {
                        const item = fromUuidSync(itemMacroDetails?.itemUuid);
                        item.sheet.render(true);
                    }
                }
            }
        ]);

    }

}

/**
 * Get the actor from a macro's flags
 * @param {foundry.documents.Macro} macro
 * @returns {?ActorSFRPG}
 */
function findActorSync(macro) {
    let actor = null;

    const flags = macro?.flags?.sfrpg;
    if (flags) {
        actor = fromUuidSync(flags.actor)
            ?? fromUuidSync(flags.itemMacro?.itemUuid)?.actor; // backwards compatibility
    }

    return actor;
}
