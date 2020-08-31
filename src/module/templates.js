/**
 * Define a set of template paths to pre-load
 * 
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * 
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Actor Sheet Partials
        "systems/sfrpg/templates/actors/parts/actor-traits.html",
        "systems/sfrpg/templates/actors/parts/actor-inventory.html",
        "systems/sfrpg/templates/actors/parts/actor-inventory-item.html",
        "systems/sfrpg/templates/actors/parts/actor-features.html",
        "systems/sfrpg/templates/actors/parts/actor-features-item.html",
        "systems/sfrpg/templates/actors/parts/actor-spellbook.html",
        "systems/sfrpg/templates/actors/parts/actor-modifiers.html",

        // Item Sheet Partials
        "systems/sfrpg/templates/items/parts/item-action.html",
        "systems/sfrpg/templates/items/parts/item-activation.html",
        "systems/sfrpg/templates/items/parts/item-description.html",
        "systems/sfrpg/templates/items/parts/item-capacity.html",
        "systems/sfrpg/templates/items/parts/item-modifiers.html",
        "systems/sfrpg/templates/items/parts/item-header.html",
        "systems/sfrpg/templates/items/parts/physical-item-details.html",
        "systems/sfrpg/templates/items/parts/container-details.html"
    ];

    return loadTemplates(templatePaths);
};
