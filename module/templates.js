/**
 * Define a set of template paths to pre-load
 * 
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * 
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        "public/systems/starfinder/templates/actors/actor-sheet.html",
        "public/systems/starfinder/templates/actors/actor-attributes.html",
        "public/systems/starfinder/templates/actors/actor-abilities.html",
        "public/systems/starfinder/templates/actors/actor-biography.html",
        "public/systems/starfinder/templates/actors/actor-skills.html",
        "public/systems/starfinder/templates/actors/actor-traits.html",
        "public/systems/starfinder/templates/actors/actor-classes.html",

        "public/systems/starfinder/templates/items/class-sidebar.html",
        "public/systems/starfinder/templates/items/consumable-details.html",
        "public/systems/starfinder/templates/items/consumable-sidebar.html",
        "public/systems/starfinder/templates/items/equipment-details.html",
        "public/systems/starfinder/templates/items/equipment-sidebar.html",
        "public/systems/starfinder/templates/items/feat-details.html",
        "public/systems/starfinder/templates/items/feat-sidebar.html",
        "public/systems/starfinder/templates/items/spell-details.html",
        "public/systems/starfinder/templates/items/spell-sidebar.html",
        "public/systems/starfinder/templates/items/tool-sidebar.html",
        "public/systems/starfinder/templates/items/weapon-details.html",
        "public/systems/starfinder/templates/items/weapon-sidebar.html"
    ];

    return loadTemplates(templatePaths);
};
