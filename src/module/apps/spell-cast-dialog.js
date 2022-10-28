import { ActorSFRPG } from "../actor/actor.js";
import { ItemSFRPG } from "../item/item.js";

/**
 * A specialized Dialog subclass for casting a spell item at a certain level
 * @type {Dialog}
 */
export class SpellCastDialog extends Dialog {
    constructor(actor, item, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog"];
  
        /**
         * Store a reference to the Actor entity which is casting the spell
         * @type {ActorSFRPG}
         */
        this.actor = actor;
    
        /**
         * Store a reference to the Item entity which is the spell being cast
         * @type {ItemSFRPG}
         */
        this.item = item;
    }
  
    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */
  
    activateListeners(html) {
        super.activateListeners(html);
    }
  
    /* -------------------------------------------- */
  
    /**
     * A constructor function which displays the Spell Cast Dialog app for a given Actor and Item.
     * Returns a Promise which resolves to the dialog FormData once the workflow has been completed.
     * @param {ActorSFRPG} actor
     * @param {ItemSFRPG} item
     * @return {Promise}
     */
    static async create(actor, item) {
        const casterData = actor.system;
        const spellData = item.system;
    
        const maxSpellLevel = spellData.level;

        // Stupid spell slots counter
        const availableSlots = {
            1: {
                general: 0,
                perClass: {}
            },
            2: {
                general: 0,
                perClass: {}
            },
            3: {
                general: 0,
                perClass: {}
            },
            4: {
                general: 0,
                perClass: {}
            },
            5: {
                general: 0,
                perClass: {}
            },
            6: {
                general: 0,
                perClass: {}
            }
        }
        for (let spellLevel = 1; spellLevel <= 6; spellLevel++) {
            const spellsPerLevel = casterData.spells[`spell${spellLevel}`];
            if (spellsPerLevel) {
                let hasClasses = false;
                for (const [key, perClass] of Object.entries(spellsPerLevel.perClass)) {
                    if (perClass.max > 0) {
                        hasClasses = true;
                    }

                    if (perClass.value > 0) {
                        availableSlots[spellLevel].perClass[key] = {class: key, value: perClass.value}
                    }
                }

                if (!hasClasses) {
                    availableSlots[spellLevel].general = parseInt(spellsPerLevel.value);
                }
            }
        }

        // Determine the levels which are feasible
        const spellLevels = [];
        const includedClasses = [];
        for (const [slotLevel, slotAvailability] of Object.entries(availableSlots)) {
            if (slotLevel < maxSpellLevel && !spellData.isVariableLevel) {
                continue;
            }

            let hasClasses = false;
            for (const classSlot of Object.values(slotAvailability.perClass)) {
                hasClasses = true;
                if (classSlot.value > 0) {
                    const classEntry = casterData.spells.classes.find(x => x.key === classSlot.class);
                    if (!classEntry) {
                        continue;
                    }
                    
                    includedClasses.push(classEntry.key);

                    const label = game.i18n.format("SFRPG.SpellCasting.SpellLabelClass", {className: classEntry.name, spellSlot: game.i18n.format(CONFIG.SFRPG.spellLevels[slotLevel], slotLevel), remainingSlots: classSlot.value});
                    spellLevels.push({
                        source: classSlot.class,
                        level: slotLevel,
                        label: label,
                        canCast: true,
                        hasSlots: true,
                        total: classSlot.value
                    });
                }
            }

            if (!hasClasses && slotAvailability.general > 0) {
                spellLevels.push({
                    source: "general",
                    level: slotLevel,
                    label: game.i18n.format("SFRPG.SpellCasting.SpellLabelGeneral", {spellSlot: game.i18n.format(CONFIG.SFRPG.spellLevels[slotLevel], slotLevel), remainingSlots: slotAvailability.general}),
                    canCast: true,
                    hasSlots: true,
                    total: slotAvailability.general
                });
            }
        }

        // Render the Spell casting template
        const html = await renderTemplate("systems/sfrpg/templates/apps/spell-cast.html", {
            item: item.system,
            hasSlots: spellLevels.length > 0,
            consume: spellLevels.length > 0,
            spellLevels,
            config: CONFIG.SFRPG,
            includedClasses: includedClasses
        });
    
        // Create the Dialog and return as a Promise
        return new Promise((resolve, reject) => {
            const dlg = new this(actor, item, {
                title: game.i18n.format("SFRPG.SpellCasting.Title", {spellName: item.name}),
                content: html,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: game.i18n.localize("SFRPG.SpellCasting.ButtonCast"),
                        callback: html => resolve({
                            formData: new FormData(html[0].querySelector("#spell-config-form")),
                            spellLevels: spellLevels
                        })
                    }
                },
                default: "cast",
                close: reject
            });
            dlg.render(true);
        });
    }
}
  