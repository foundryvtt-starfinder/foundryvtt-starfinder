import { createDiceLink, linkDiceExpressions } from "./dice-links.js";

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

        linkDiceExpressions(html, createDiceLink);
    }
}
