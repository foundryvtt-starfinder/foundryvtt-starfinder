import { COMPONENT_LABELS, componentForRoll, nextStatus } from "../rules/mech-system-failure.js";
import { RPC } from "../rpc.js";

/**
 * The class marking a button whose roll has already been made.
 *
 * Shared with Replenish, whose stylesheet rule dims and strikes through a spent
 * link. The behavior is the same, so the class is too.
 */
export const SPENT_CLASS = "replenish-spent";

/**
 * Who sees a mech's system failure.
 *
 * The same audience as the regeneration and Replenish messages: the mech's
 * owners, who have to act on it, and every GM.
 *
 * @param {Iterable<{id: string, isGM: boolean}>} users The users in the world.
 * @param {{testUserPermission: Function}} actor The mech that failed.
 * @returns {string[]} The ids to whisper to.
 */
export function failureRecipients(users, actor) {
    return [...users]
        .filter(user => user.isGM || actor.testUserPermission(user, "OWNER"))
        .map(user => user.id);
}

/**
 * Mark one of a card's buttons as already rolled.
 *
 * The card is stored HTML that every viewer renders, so the spent state is
 * written into that HTML rather than onto the clicked element. A button that
 * keeps its `data-action` would be picked up by the handler again after a
 * reload, so the action comes off and the class that greys it out goes on.
 *
 * Only the button pressed is spent. A cockpit failure puts one save on the card
 * per affected operator, and rolling one of them must leave the rest live.
 *
 * @param {string} content The card's stored HTML.
 * @param {string} action The `data-action` to spend.
 * @param {string} [index] Which of several buttons of that action was pressed.
 * @returns {string} The HTML with that button spent, unchanged if it holds none.
 */
export function spendFailureLink(content, action, index = null) {
    const root = document.createElement("div");
    root.innerHTML = content ?? "";

    const selector = index === null
        ? `a[data-action="${action}"]`
        : `a[data-action="${action}"][data-index="${index}"]`;
    const link = root.querySelector(selector);
    if (!link) return content;

    delete link.dataset.action;
    link.classList.add(SPENT_CLASS);

    return root.innerHTML;
}

/**
 * Write a button's spent state back to the card it belongs to.
 *
 * Updating a chat message is the author's or the GM's to do, so a player
 * clicking a card someone else posted asks the GM to make the change.
 *
 * @param {Element} card The rendered chat card.
 * @param {string} action The `data-action` that was pressed.
 * @param {string} [index] Which of several buttons of that action was pressed.
 * @returns {Promise<void>}
 */
async function markSpent(card, action, index = null) {
    const messageId = card?.closest("[data-message-id]")?.dataset.messageId;
    const message = messageId ? game.messages.get(messageId) : null;
    if (!message) return;

    const content = spendFailureLink(message.content, action, index);
    if (content === message.content) return;

    if (game.user.isGM || message.isAuthor) {
        await message.update({ content });
        return;
    }

    RPC.sendMessageTo("gm", "spendMechFailure", { messageId: message.id, content });
}

/**
 * Spend a card on behalf of a player who cannot update it themselves.
 *
 * @param {object} message The RPC message.
 * @returns {Promise<void>}
 */
export async function onSpendMechFailure(message) {
    const target = game.messages.get(message.payload?.messageId);
    if (!target) return;

    await target.update({ content: message.payload.content });
}

/**
 * The mech a failure card belongs to, if the clicker is entitled to roll it.
 *
 * The card names the mech by uuid rather than id, so an unlinked token's own
 * copy of a mech answers for itself instead of the base actor.
 *
 * @param {Element} link The button that was clicked.
 * @returns {Promise<Actor|null>} The mech, or null with a notice already shown.
 */
async function mechForCard(link) {
    const card = link.closest("[data-actor-uuid]");
    const actor = card?.dataset.actorUuid ? await fromUuid(card.dataset.actorUuid) : null;

    if (!actor || actor.type !== "mech") {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.SystemFailure.NoMech"));
        return null;
    }

    if (!actor.isOwner) {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.SystemFailure.NotOwner"));
        return null;
    }

    return actor;
}

/**
 * The localized name of a component.
 *
 * @param {string} component The component key.
 * @returns {string} Its name in the current language.
 */
export function componentName(component) {
    return game.i18n.localize(`SFRPG.MechSheet.Systems.${COMPONENT_LABELS[component]}`);
}

/**
 * Handle a click on a failure card's 1d20, choosing and applying the component.
 *
 * Nothing has happened to the mech until this is pressed.
 *
 * @param {Event} event The click event.
 * @returns {Promise<string|null>} The component that failed, or null if nothing was rolled.
 */
export async function onMechFailureRollClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const link = event.currentTarget;
    if (link.classList.contains(SPENT_CLASS)) return null;

    const actor = await mechForCard(link);
    if (!actor) return null;

    const roll = await new Roll(link.dataset.formula).evaluate();
    const component = componentForRoll(roll.total);
    if (!component) return null;

    const status = nextStatus(actor.system.attributes.systems[component]?.value);
    await actor.update({ [`system.attributes.systems.${component}.value`]: status });

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.format("SFRPG.MechSheet.SystemFailure.Result", {
            name: actor.name,
            component: componentName(component),
            status: game.i18n.localize(CONFIG.SFRPG.mechSystemStatus[status])
        }),
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });

    await markSpent(link.closest("[data-actor-uuid]"), "mechFailureRoll");

    return component;
}
