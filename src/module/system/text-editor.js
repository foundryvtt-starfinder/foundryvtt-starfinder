import { linkDiceExpressions } from "./dice-links.js";

/**
 * The system's text editor, which makes dice expressions written in prose rollable.
 *
 * Enrichment turns markup into elements. This runs once that has finished, so
 * the expressions it finds are the ones nothing else claimed - a `[[/r 1d6]]`
 * is already an anchor by this point, and anchors are left alone.
 *
 * @extends {foundry.applications.ux.TextEditor}
 */
export default class TextEditorSFRPG extends foundry.applications.ux.TextEditor {

    /** @inheritdoc */
    static async _finalizeEnrichedHTML(html, options) {
        await super._finalizeEnrichedHTML(html, options);

        linkDiceExpressions(html, (formula, text) => this.createDiceLink(formula, text));
    }

    /**
     * An anchor that rolls a formula when clicked.
     *
     * Built to match what `[[/r 1d6]]` produces, so it picks up the roll
     * handler core already binds to the document body and looks no different
     * from an expression an author marked up themselves.
     *
     * @param {string} formula The formula to roll.
     * @param {string} text The expression as it was written.
     * @returns {HTMLAnchorElement}
     */
    static createDiceLink(formula, text) {
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
}
