/**
 * Turn dice expressions written in plain prose into rollable links.
 *
 * Most of the system's own content marks its dice up as inline rolls, but text
 * typed by a GM, imported from a third party or pasted out of a book does not.
 * "takes 2d6 acid damage" reads the same either way, and a player still has to
 * go and roll it by hand. Finding the expressions after enrichment has finished
 * lets that text be rolled from where it is written.
 *
 * Nothing here touches Foundry. The caller supplies the element to scan and a
 * factory that builds whatever link it wants, which is what keeps the matching
 * and the DOM walk testable on their own.
 */

/**
 * A dice expression as it appears in prose.
 *
 * The count and the die size are each capped at three digits so a stray number
 * pair cannot be read as a roll, and both are required so that a bare "d20" is
 * left as the words it probably is. Everything around the match is fenced off:
 *
 * - The lookbehind rejects a preceding word character or dot, so an identifier
 *   like "x1d4" and a version like "3.1d4" are left alone.
 * - The trailing lookahead rejects a word character. That both skips "1d4x10"
 *   rather than linking a "1d4" whose multiplier has been cut off, and stops
 *   "1d4+1d6" being read as "1d4+1" with a stray "d6" left after it - the +1
 *   cannot end the match while a d follows, so the two dice are read as two
 *   expressions instead.
 *
 * @type {RegExp}
 */
const DICE_EXPRESSION = /(?<![\w.])\d{1,3}[dD]\d{1,3}(?:\s*[+-]\s*\d{1,3})?(?!\w)/g;

/**
 * Elements whose text is left alone.
 *
 * An anchor is already something to click - an inline roll, a content link or
 * one of the system's own enriched links - and a link inside a link is markup
 * a browser will not nest. The rest show their text verbatim, so a dice
 * expression in them is being quoted rather than described.
 *
 * @type {Set<string>}
 */
const UNLINKED_ELEMENTS = new Set(["A", "CODE", "PRE", "TEXTAREA"]);

/**
 * The dice expressions in a piece of text.
 *
 * @param {string} text The text to scan.
 * @returns {Array<{text: string, formula: string, index: number}>} One entry per expression, in the order they appear.
 */
export function diceExpressions(text) {
    if (!text) return [];

    return [...text.matchAll(DICE_EXPRESSION)].map(match => ({
        text: match[0],
        formula: rollFormula(match[0]),
        index: match.index
    }));
}

/**
 * A matched expression as a roll formula.
 *
 * The text is shown to the reader as they wrote it, spacing and capitals and
 * all, but the formula behind it is normalized so the roll parser sees the
 * shape it expects.
 *
 * @param {string} text The matched text.
 * @returns {string} The formula to roll.
 */
function rollFormula(text) {
    return text.replace(/\s+/g, "").replace(/D/g, "d");
}

/**
 * Replace every dice expression under an element with a link.
 *
 * @param {Element} root The element to scan. Its own text is included.
 * @param {function(string, string): ?Node} createLink Builds the link, given the roll formula and the text as written. Returning nothing leaves that expression as it was.
 */
export function linkDiceExpressions(root, createLink) {
    if (!root || typeof createLink !== "function") return;

    // Collected up front because replacing a text node while walking would put
    // the newly created link's own text back in front of the walker.
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
        if (isUnlinked(node, root)) continue;
        linkTextNode(node, createLink);
    }
}

/**
 * Whether a text node sits inside something that should not be linked.
 *
 * @param {Text} node The text node.
 * @param {Element} root The element the walk started from.
 * @returns {boolean}
 */
function isUnlinked(node, root) {
    for (let element = node.parentElement; element; element = element.parentElement) {
        if (UNLINKED_ELEMENTS.has(element.tagName)) return true;
        if (element === root) break;
    }

    return false;
}

/**
 * Replace the dice expressions in one text node.
 *
 * @param {Text} node The text node to split up.
 * @param {function(string, string): ?Node} createLink Builds the link.
 */
function linkTextNode(node, createLink) {
    const expressions = diceExpressions(node.textContent);

    // Back to front, so that splitting off a later expression leaves the text
    // before it - and every earlier index into it - untouched.
    for (const expression of expressions.reverse()) {
        const link = createLink(expression.formula, expression.text);
        if (!link) continue;

        let target = node;
        if (expression.index > 0) target = target.splitText(expression.index);
        if (expression.text.length < target.textContent.length) target.splitText(expression.text.length);

        target.replaceWith(link);
    }
}

/**
 * An anchor that rolls a formula when clicked.
 *
 * Built to match what `[[/r 1d6]]` produces, so it picks up the roll handler
 * core already binds to the document body and looks no different from an
 * expression an author marked up themselves.
 *
 * @param {string} formula The formula to roll.
 * @param {string} text The expression as it was written.
 * @returns {HTMLAnchorElement}
 */
export function createDiceLink(formula, text) {
    const a = document.createElement("a");

    a.classList.add("inline-roll", "roll");
    a.dataset.formula = formula;
    a.dataset.flavor = "";
    a.dataset.tooltipText = formula;

    const icon = document.createElement("i");
    icon.classList.add("fa-solid", "fa-dice-d20");
    icon.inert = true;

    a.append(icon, text);

    return a;
}
