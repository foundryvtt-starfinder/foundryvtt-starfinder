/**
 * Turn the dice link already sitting in a mech action's description into the
 * control the action needs.
 *
 * An action's description names its own dice - Aim's "roll 1d4", Replenish's
 * "you gain 2d8 SP" - and enriching the text turns that expression into a roll
 * link like any other. That link is where a player's eye goes, so it is what the
 * action hangs its behavior on rather than a second button saying the same thing.
 *
 * The roll and inline-roll classes come off, because a link left carrying them is
 * also claimed by Foundry's own inline roll handler and the die would be rolled
 * twice - once into chat and once into whatever the action does with it.
 *
 * @param {Element} root The enriched description.
 * @param {string} formula The formula the action declared, e.g. "1d4".
 * @param {object} [options]
 * @param {string} [options.action] The `data-action` the click handler is bound to.
 * @param {Object<string, string>} [options.data] Further values to carry on the link.
 * @param {string} [options.tooltip] Hover text explaining what clicking does.
 * @returns {HTMLAnchorElement|null} The promoted link, or null if the description held no such dice link.
 */
export function promoteDiceLink(root, formula, { action = "", data = {}, tooltip = "" } = {}) {
    if (!root) return null;

    const links = [...root.querySelectorAll("a.inline-roll")];
    const link = links.find(candidate => candidate.dataset.formula === formula);
    if (!link) return null;

    link.classList.remove("inline-roll", "roll");
    link.classList.add("enriched-link");

    delete link.dataset.flavor;
    delete link.dataset.tooltipText;

    if (action) link.dataset.action = action;
    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) link.dataset[key] = String(value);
    }
    if (tooltip) link.dataset.tooltip = tooltip;

    return link;
}
