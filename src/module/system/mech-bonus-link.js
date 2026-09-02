import { promoteDiceLink } from "./mech-dice-link.js";

/**
 * Turn the dice link already sitting in a mech action's description into the
 * control that arms the bonus.
 *
 * Aim's description reads "roll 1d4 and add the result as an insight bonus to the
 * attack roll", and enriching it turns that 1d4 into a roll link like any other
 * dice expression in system text. That link is where a player's eye goes, so it
 * is what arms the bonus rather than a second button saying the same thing.
 *
 * @param {Element} root The enriched description.
 * @param {string} formula The formula the action declared, e.g. "1d4".
 * @param {Object} [data] Values to carry on the link.
 * @param {string} [data.source] Name of the action arming the bonus.
 * @param {number} [data.ppSpent] Power Points already spent on it, for a refund on disarm.
 * @param {string} [data.itemId] Component the action is printed on, if the bonus is restricted to its weapon.
 * @param {string} [data.tooltip] Hover text explaining what clicking does.
 * @returns {HTMLAnchorElement|null} The promoted link, or null if the description held no such dice link.
 */
export function promoteDiceLinkToBonus(root, formula, { source = "", ppSpent = 0, itemId = null, tooltip = "" } = {}) {
    return promoteDiceLink(root, formula, {
        action: "mechAttackBonus",
        data: { source, ppSpent, itemId: itemId || null },
        tooltip
    });
}

/**
 * Handle a click on a promoted dice link, rolling the die and arming the bonus.
 *
 * The mech is read from the card's uuid rather than its id, so an unlinked token's
 * own copy of a mech arms its own bonus instead of the base actor's.
 *
 * @param {Event} event The click event
 * @returns {Promise<number|null>} The rolled bonus, or null if it could not be armed
 */
export async function onMechAttackBonusClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const link = event.currentTarget;
    const card = link.closest("[data-actor-uuid]");
    const actor = card?.dataset.actorUuid ? await fromUuid(card.dataset.actorUuid) : null;

    if (!actor || actor.type !== "mech") {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.AttackBonusOverride.NoMech"));
        return null;
    }

    if (!actor.isOwner) {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.AttackBonusOverride.NotOwner"));
        return null;
    }

    return actor.armMechAttackBonus(link.dataset.formula, {
        source: link.dataset.source,
        ppSpent: Number(link.dataset.ppSpent) || 0,
        itemId: link.dataset.itemId ?? null
    });
}
