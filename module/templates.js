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
    "systems/starfinder/templates/actors/parts/actor-traits.html",
    "systems/starfinder/templates/actors/parts/actor-inventory.html",
    "systems/starfinder/templates/actors/parts/actor-features.html",
    "systems/starfinder/templates/actors/parts/actor-spellbook.html",

    // Item Sheet Partials
    "systems/starfinder/templates/items/parts/item-action.html",
    "systems/starfinder/templates/items/parts/item-activation.html",
    "systems/starfinder/templates/items/parts/item-description.html"
    ];

    return loadTemplates(templatePaths);
};
