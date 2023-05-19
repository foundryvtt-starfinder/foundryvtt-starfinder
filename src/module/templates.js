/**
 * Define a set of template paths to pre-load
 *
 * Pre-loaded templates are compiled and cached for fast access when rendering
 *
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    const templatePaths = [
        // Actor Sheet Partials
        "systems/sfrpg/templates/actors/parts/actor-biography.hbs",
        "systems/sfrpg/templates/actors/parts/actor-features-item.hbs",
        "systems/sfrpg/templates/actors/parts/actor-features.hbs",
        "systems/sfrpg/templates/actors/parts/actor-inventory-item.hbs",
        "systems/sfrpg/templates/actors/parts/actor-inventory.hbs",
        "systems/sfrpg/templates/actors/parts/actor-modifiers.hbs",
        "systems/sfrpg/templates/actors/parts/actor-movement-element.hbs",
        "systems/sfrpg/templates/actors/parts/actor-spellbook.hbs",
        "systems/sfrpg/templates/actors/parts/actor-traits.hbs",
        "systems/sfrpg/templates/actors/parts/actor-vehicle-system-item.hbs",
        "systems/sfrpg/templates/actors/parts/actor-vehicle-systems.hbs",

        // Item Sheet Partials
        "systems/sfrpg/templates/items/parts/item-action.hbs",
        "systems/sfrpg/templates/items/parts/item-activation.hbs",
        "systems/sfrpg/templates/items/parts/item-description.hbs",
        "systems/sfrpg/templates/items/parts/item-capacity.hbs",
        "systems/sfrpg/templates/items/parts/item-modifiers.hbs",
        "systems/sfrpg/templates/items/parts/item-header.hbs",
        "systems/sfrpg/templates/items/parts/item-special-materials.hbs",
        "systems/sfrpg/templates/items/parts/item-descriptors.hbs",
        "systems/sfrpg/templates/items/parts/item-status.hbs",
        "systems/sfrpg/templates/items/parts/physical-item-details.hbs",
        "systems/sfrpg/templates/items/parts/starship-component.hbs",
        "systems/sfrpg/templates/items/parts/container-details.hbs",
        "systems/sfrpg/templates/items/parts/weapon-properties.hbs"
    ];

    return loadTemplates(templatePaths);
};
