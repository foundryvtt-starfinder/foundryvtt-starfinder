import { replenishedShieldPoints } from "../rules/mech-replenish.js";
import { promoteDiceLink } from "./mech-dice-link.js";
import { RPC } from "../rpc.js";

/** The class marking a link whose roll has already been made. */
export const SPENT_CLASS = "replenish-spent";

/**
 * Turn the dice in Replenish's description into the control that rolls them.
 *
 * @param {Element} root The enriched description.
 * @param {string} formula The dice this mech's tier grants, e.g. "2d8".
 * @param {Object} [data] Values to carry on the link.
 * @param {string} [data.source] Name of the action, for the chat card.
 * @param {string} [data.tooltip] Hover text explaining what clicking does.
 * @returns {HTMLAnchorElement|null} The promoted link, or null if the description held no such dice link.
 */
export function promoteDiceLinkToReplenish(root, formula, { source = "", tooltip = "" } = {}) {
    return promoteDiceLink(root, formula, {
        action: "mechReplenish",
        data: { source },
        tooltip
    });
}

/**
 * Mark a card's Replenish link as already rolled.
 *
 * The card is stored HTML that every viewer renders, so the spent state is written
 * into that HTML rather than onto the clicked element. A link that keeps its
 * `data-action` would be picked up by the handler again after a reload, so the
 * action comes off and the class that greys it out goes on.
 *
 * @param {string} content The card's stored HTML.
 * @returns {string} The HTML with the link spent, unchanged if it holds no such link.
 */
export function spendReplenishLink(content) {
    const root = document.createElement("div");
    root.innerHTML = content ?? "";

    const link = root.querySelector('a[data-action="mechReplenish"]');
    if (!link) return content;

    delete link.dataset.action;
    link.classList.add(SPENT_CLASS);

    return root.innerHTML;
}

/**
 * Handle a click on Replenish's dice, rolling them and restoring the Shield Points.
 *
 * The mech is read from the card's uuid rather than its id, so an unlinked token's
 * own copy of a mech replenishes its own shields instead of the base actor's.
 *
 * @param {Event} event The click event
 * @returns {Promise<number|null>} The Shield Points gained, or null if nothing was rolled
 */
export async function onMechReplenishClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const link = event.currentTarget;
    if (link.classList.contains(SPENT_CLASS)) return null;

    const card = link.closest("[data-actor-uuid]");
    const actor = card?.dataset.actorUuid ? await fromUuid(card.dataset.actorUuid) : null;

    if (!actor || actor.type !== "mech") {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.Replenish.NoMech"));
        return null;
    }

    // The card is whispered to the mech's owners and the GM, and the roll is theirs
    // to make. Anyone else reaching the link is not entitled to the Shield Points.
    if (!actor.isOwner) {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.Replenish.NotOwner"));
        return null;
    }

    const roll = await new Roll(link.dataset.formula).evaluate();
    const sp = actor.system.attributes.sp;
    const { value, gained } = replenishedShieldPoints(sp, roll.total);

    if (gained > 0) {
        await actor.update({ "system.attributes.sp.value": value });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.format("SFRPG.MechSheet.Actions.SPRegenMessage", {
                name: actor.name,
                amount: gained,
                current: value,
                max: sp.max
            }),
            whisper: game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id)
        });
    }

    await markCardSpent(card);

    return gained;
}

/**
 * Write the spent state back to the card the link belongs to.
 *
 * Updating a chat message is the author's or the GM's to do, so a player clicking
 * a card someone else posted asks the GM to make the change on their behalf.
 *
 * @param {Element} card The rendered chat card.
 * @returns {Promise<void>}
 */
async function markCardSpent(card) {
    const messageId = card?.closest("[data-message-id]")?.dataset.messageId;
    const message = messageId ? game.messages.get(messageId) : null;
    if (!message) return;

    const content = spendReplenishLink(message.content);
    if (content === message.content) return;

    if (game.user.isGM || message.isAuthor) {
        await message.update({ content });
        return;
    }

    RPC.sendMessageTo("gm", "spendMechReplenish", { messageId: message.id, content });
}

/**
 * Spend a card on behalf of a player who cannot update it themselves.
 *
 * @param {object} message The RPC message.
 * @returns {Promise<void>}
 */
export async function onSpendMechReplenish(message) {
    const target = game.messages.get(message.payload?.messageId);
    if (!target) return;

    await target.update({ content: message.payload.content });
}
