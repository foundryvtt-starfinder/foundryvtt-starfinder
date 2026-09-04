import { COMPONENT_LABELS, componentForRoll, nextStatus } from "../rules/mech-system-failure.js";
import {
    auxiliarySelection,
    auxiliaryToDisable,
    chanceFailed,
    cockpitDamage,
    cockpitSaveDC,
    cockpitVictimCount,
    powerCoreLoss
} from "../rules/mech-system-transitions.js";
import { auxiliaryFailureChance } from "../rules/mech-system-effects.js";
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

    const outcome = game.i18n.format("SFRPG.MechSheet.SystemFailure.Result", {
        name: actor.name,
        component: componentName(component),
        status: game.i18n.localize(CONFIG.SFRPG.mechSystemStatus[status])
    }) + effectText(component, status);

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: await failureContent(actor, outcome + transitionMarkup(actor, component, status)),
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });

    await markSpent(link.closest("[data-actor-uuid]"), "mechFailureRoll");

    return component;
}

/**
 * What a component's new condition does to the mech, in a sentence.
 *
 * The card is where the player learns what just happened to their mech, so it
 * says what the condition costs rather than leaving them to look it up.
 *
 * @param {string} component The component that failed.
 * @param {string} status The status it has taken on.
 * @returns {string} A paragraph of HTML, empty when there is nothing to say.
 */
export function effectText(component, status) {
    const label = COMPONENT_LABELS[component];
    if (!label) return "";

    const suffix = status === "inoperable" ? "Inoperable" : "Malfunctioning";
    return `<p class="mech-failure-effect">`
        + game.i18n.localize(`SFRPG.MechSheet.SystemFailure.Effect${label}${suffix}`)
        + `</p>`;
}

/**
 * The operators aboard a mech.
 *
 * @param {Actor} actor The mech.
 * @returns {Array<Actor>} Its operators, in crew order.
 */
export function mechOperators(actor) {
    return (actor.crew?.operator?.actors ?? []).filter(Boolean);
}

/**
 * The mech's auxiliary systems, in the order a selection roll counts them.
 *
 * @param {Actor} actor The mech.
 * @returns {Array<Item>} Its auxiliary system items.
 */
export function auxiliarySystems(actor) {
    return actor.items.filter(item => item.type === "mechAuxiliary");
}

/**
 * Render the failure card's shell around some content.
 *
 * @param {Actor} actor The mech.
 * @param {string} prompt The card's body, which may hold buttons.
 * @returns {Promise<string>} The card's HTML.
 */
async function failureContent(actor, prompt) {
    return foundry.applications.handlebars.renderTemplate(
        "systems/sfrpg/templates/chat/mech-failure-card.hbs",
        { actorId: actor.id, actorUuid: actor.uuid, img: actor.img, name: actor.name, prompt }
    );
}

/**
 * The markup for whatever this component's new condition costs at once.
 *
 * Each cost is a die on the card rather than something rolled here, so the
 * player sees every roll made against their mech.
 *
 * The saves go to the operators in crew order. The printed rule lets the mech
 * choose which half of the crew a malfunctioning cockpit hurts; taking them in
 * order keeps the card to one press per operator, and a GM who wants a
 * different half can apply that damage directly.
 *
 * @param {Actor} actor The mech.
 * @param {string} component The component that failed.
 * @param {string} status The status it has taken on.
 * @returns {string} HTML to append to the outcome, empty when nothing is owed.
 */
function transitionMarkup(actor, component, status) {
    const operators = mechOperators(actor);
    const tier = actor.system.details.tier;
    const buttons = transitionButtons({
        component,
        status,
        tier,
        operatorCount: operators.length,
        auxiliaryCount: auxiliarySystems(actor).length
    });
    if (buttons.length === 0) return "";

    const dc = cockpitSaveDC(tier);
    return buttons.map(button => {
        const operator = operators[button.index];
        const label = button.action === "mechCockpitSave"
            ? game.i18n.format("SFRPG.MechSheet.SystemFailure.CockpitSaveLabel", {
                operator: operator?.name ?? "",
                formula: button.formula
            })
            : button.formula;
        const tooltip = button.action === "mechCockpitSave"
            ? game.i18n.format("SFRPG.MechSheet.SystemFailure.CockpitSaveTooltip", { dc })
            : game.i18n.localize(button.action === "mechPowerCoreLoss"
                ? "SFRPG.MechSheet.SystemFailure.PowerCoreLossTooltip"
                : "SFRPG.MechSheet.SystemFailure.AuxiliaryPickTooltip");

        return `<p><a class="enriched-link" data-action="${button.action}"`
            + ` data-formula="${button.formula}" data-index="${button.index}" data-dc="${dc}"`
            + (operator ? ` data-operator-uuid="${operator.uuid}"` : "")
            + ` data-tooltip="${tooltip}">${label}</a></p>`;
    }).join("");
}

/**
 * The shared opening of every button handler on a failure card.
 *
 * @param {Event} event The click event.
 * @returns {Promise<{link: Element, actor: Actor, card: Element}|null>} The click's subject, or null.
 */
async function beginClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const link = event.currentTarget;
    if (link.classList.contains(SPENT_CLASS)) return null;

    const actor = await mechForCard(link);
    if (!actor) return null;

    return { link, actor, card: link.closest("[data-actor-uuid]") };
}

/**
 * Handle a click on the Power Points a failing core costs its mech.
 *
 * @param {Event} event The click event.
 * @returns {Promise<number|null>} The Power Points lost, or null if nothing was rolled.
 */
export async function onMechPowerCoreLossClick(event) {
    const clicked = await beginClick(event);
    if (!clicked) return null;

    const { link, actor, card } = clicked;
    const roll = await new Roll(link.dataset.formula).evaluate();
    const current = actor.system.attributes.pp.value || 0;
    const lost = Math.min(roll.total, current);

    await actor.update({ "system.attributes.pp.value": current - lost });
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.format("SFRPG.MechSheet.SystemFailure.PowerCoreLoss", { name: actor.name, amount: lost }),
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });
    await markSpent(card, "mechPowerCoreLoss", link.dataset.index);

    return lost;
}

/**
 * Handle a click on one operator's Reflex save against a cockpit failure.
 *
 * The save and the damage are rolled in the same click, because the save's only
 * effect is to halve the damage - asking for two presses would say nothing more.
 *
 * @param {Event} event The click event.
 * @returns {Promise<number|null>} The damage applied, or null if nothing was rolled.
 */
export async function onMechCockpitSaveClick(event) {
    const clicked = await beginClick(event);
    if (!clicked) return null;

    const { link, actor, card } = clicked;
    const operator = link.dataset.operatorUuid ? await fromUuid(link.dataset.operatorUuid) : null;
    if (!operator) {
        ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.SystemFailure.NoOperator"));
        return null;
    }

    const dc = Number(link.dataset.dc) || 0;
    const bonus = foundry.utils.getProperty(operator.system, "attributes.reflex.bonus") ?? 0;
    const save = await new Roll(`1d20 + ${bonus}`).evaluate();
    const damage = await new Roll(link.dataset.formula).evaluate();

    const saved = save.total >= dc;
    const applied = saved ? Math.floor(damage.total / 2) : damage.total;

    const Damage = game.sfrpg.Actor.Damage.SFRPGDamage;
    await operator.applyDamage(Damage.createDamage(applied, "bludgeoning"));

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.format("SFRPG.MechSheet.SystemFailure.CockpitSave", {
            operator: operator.name,
            result: save.total,
            dc,
            amount: applied,
            outcome: game.i18n.localize(saved
                ? "SFRPG.MechSheet.SystemFailure.SaveMade"
                : "SFRPG.MechSheet.SystemFailure.SaveFailed")
        }),
        rolls: [save, damage],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });
    await markSpent(card, "mechCockpitSave", link.dataset.index);

    return applied;
}

/**
 * Handle a click on the roll that picks which auxiliary system stops working.
 *
 * @param {Event} event The click event.
 * @returns {Promise<Item|null>} The system that stopped, or null if nothing was rolled.
 */
export async function onMechAuxiliaryPickClick(event) {
    const clicked = await beginClick(event);
    if (!clicked) return null;

    const { link, actor, card } = clicked;
    const roll = await new Roll(link.dataset.formula).evaluate();
    const system = auxiliaryToDisable(auxiliarySystems(actor), roll.total);
    if (!system) return null;

    await system.update({ "flags.sfrpg.disabledByFailure": true });
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.format("SFRPG.MechSheet.SystemFailure.AuxiliaryDisabled", { name: system.name }),
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });
    await markSpent(card, "mechAuxiliaryPick", link.dataset.index);

    return system;
}

/**
 * The buttons a component's new condition puts on the failure card.
 *
 * Every one of them is a die somebody has to press. A component whose failure
 * costs nothing at the moment it happens gets none.
 *
 * @param {object} options
 * @param {string} options.component The component that failed.
 * @param {string} options.status The status it has taken on.
 * @param {number} [options.tier] The mech's tier.
 * @param {number} [options.operatorCount] How many operators are aboard.
 * @param {number} [options.auxiliaryCount] How many auxiliary systems the mech carries.
 * @returns {Array<{action: string, formula: string, index: number}>} The buttons to add.
 */
export function transitionButtons({ component, status, tier = 0, operatorCount = 0, auxiliaryCount = 0 } = {}) {
    if (component === "powerCore") {
        const formula = powerCoreLoss(status);
        return formula ? [{ action: "mechPowerCoreLoss", formula, index: 0 }] : [];
    }

    if (component === "cockpit") {
        const formula = cockpitDamage(tier);
        return Array.from(
            { length: cockpitVictimCount(operatorCount, status) },
            (unused, index) => ({ action: "mechCockpitSave", formula, index })
        );
    }

    if (component === "auxSystem" && status === "inoperable") {
        const formula = auxiliarySelection(auxiliaryCount);
        return formula ? [{ action: "mechAuxiliaryPick", formula, index: 0 }] : [];
    }

    return [];
}

/**
 * Post a card carrying one percentage check for the player to roll.
 *
 * The chance is written into the button rather than checked here, so the roll
 * that decides it is a press the player makes and can see.
 *
 * @param {Actor} actor The mech the check is about.
 * @param {object} options
 * @param {number} options.chance The chance in a hundred of failing.
 * @param {string} options.purpose "auxiliary" or "cockpit".
 * @param {string} options.label The button's text.
 * @param {string} [options.systemId] The auxiliary system the check is about.
 * @returns {Promise<ChatMessage|null>} The card, or null when nothing can fail.
 */
export async function postChanceCard(actor, { chance, purpose, label, systemId = null }) {
    if (!chance) return null;

    const tooltip = game.i18n.localize("SFRPG.MechSheet.SystemFailure.ChanceTooltip");
    const prompt = `<p><a class="enriched-link" data-action="mechChanceCheck"`
        + ` data-formula="1d100" data-chance="${chance}" data-purpose="${purpose}"`
        + (systemId ? ` data-system-id="${systemId}"` : "")
        + ` data-index="0" data-tooltip="${tooltip}">${label}</a></p>`;

    return ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: await failureContent(actor, prompt),
        whisper: failureRecipients(game.users, actor)
    });
}

/**
 * Whether an auxiliary system is working at all.
 *
 * Two things stop one: the selection roll an inoperable auxiliary component
 * makes, which stops a system for good, and a percentage check the system
 * failed this turn, which stops it until the mech's next turn.
 *
 * @param {Item} system The auxiliary system.
 * @returns {boolean} False when the system does nothing at the moment.
 */
export function auxiliarySystemUsable(system) {
    return !system.getFlag("sfrpg", "disabledByFailure")
        && !system.getFlag("sfrpg", "failedThisTurn");
}

/**
 * Post the check an auxiliary system owes before it is relied on.
 *
 * A system that is not working at all is skipped: there is nothing to find out
 * about a system that has already stopped.
 *
 * @param {Actor} actor The mech.
 * @param {Item} system The auxiliary system being relied on.
 * @param {string} status The auxiliary component's effective status.
 * @returns {Promise<ChatMessage|null>} The card, or null when none is owed.
 */
export async function postAuxiliaryCheck(actor, system, status) {
    if (!auxiliarySystemUsable(system)) return null;

    const chance = auxiliaryFailureChance(status);
    return postChanceCard(actor, {
        chance,
        purpose: "auxiliary",
        systemId: system.id,
        label: game.i18n.format("SFRPG.MechSheet.SystemFailure.AuxiliaryCheckLabel", {
            name: system.name,
            chance
        })
    });
}

/**
 * Handle a click on a percentage check.
 *
 * @param {Event} event The click event.
 * @returns {Promise<boolean|null>} True when the check failed, or null if nothing was rolled.
 */
export async function onMechChanceCheckClick(event) {
    const clicked = await beginClick(event);
    if (!clicked) return null;

    const { link, actor, card } = clicked;
    const roll = await new Roll(link.dataset.formula).evaluate();
    const failed = chanceFailed(roll.total, Number(link.dataset.chance));

    const outcome = link.dataset.purpose === "cockpit"
        ? (failed ? "CockpitActionLost" : "CockpitActionKept")
        : (failed ? "AuxiliaryFailed" : "AuxiliaryWorked");

    // An auxiliary system that failed its check cannot be used again until the
    // start of the mech's next turn, which is when the flag is cleared. The
    // cockpit's lost action is spent as it happens and leaves nothing behind.
    if (failed && link.dataset.purpose === "auxiliary" && link.dataset.systemId) {
        await actor.items.get(link.dataset.systemId)?.setFlag("sfrpg", "failedThisTurn", true);
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.localize(`SFRPG.MechSheet.SystemFailure.${outcome}`),
        rolls: [roll],
        sound: CONFIG.sounds.dice,
        whisper: failureRecipients(game.users, actor)
    });
    await markSpent(card, "mechChanceCheck", link.dataset.index);

    return failed;
}
