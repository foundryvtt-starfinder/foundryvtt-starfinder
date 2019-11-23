/**
 * Define a set of template paths to pre-load
 * 
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * 
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        "systems/starfinder/templates/actors/actor-sheet.html",
        "systems/starfinder/templates/actors/actor-attributes.html",
        "systems/starfinder/templates/actors/actor-abilities.html",
        "systems/starfinder/templates/actors/actor-biography.html",
        "systems/starfinder/templates/actors/actor-skills.html",
        "systems/starfinder/templates/actors/actor-traits.html",
        "systems/starfinder/templates/actors/actor-classes.html",

        "systems/starfinder/templates/items/class-sidebar.html",
        "systems/starfinder/templates/items/consumable-details.html",
        "systems/starfinder/templates/items/consumable-sidebar.html",
        "systems/starfinder/templates/items/equipment-details.html",
        "systems/starfinder/templates/items/equipment-sidebar.html",
        "systems/starfinder/templates/items/feat-details.html",
        "systems/starfinder/templates/items/feat-sidebar.html",
        "systems/starfinder/templates/items/spell-details.html",
        "systems/starfinder/templates/items/spell-sidebar.html",
        "systems/starfinder/templates/items/tool-sidebar.html",
        "systems/starfinder/templates/items/weapon-details.html",
        "systems/starfinder/templates/items/weapon-sidebar.html"
    ];

    return loadTemplates(templatePaths);
};
