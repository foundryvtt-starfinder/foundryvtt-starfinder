import { tokenSizes } from "./token-sizes.js";

/** The feet of ground one grid square covers on a scene drawn at the usual scale. */
const FEET_PER_SQUARE = 5;

/**
 * How many squares a token occupies on a scene whose squares are `gridDistance`
 * feet across, given the squares it was drawn at on a 5 ft scene.
 *
 * @param {number} squaresAtFiveFeet  The token's size in 5 ft squares.
 * @param {number} gridDistance       The scene's grid distance in feet.
 * @param {object} [options]
 * @param {boolean} [options.isMech]  Whether the token is a mech.
 * @returns {number} The size to give that side of the token, in squares.
 */
export function scaledTokenSize(squaresAtFiveFeet, gridDistance, { isMech = false } = {}) {
    // A gridless scene has nothing to scale against, so keep the drawn size.
    if (!gridDistance || gridDistance <= 0) return squaresAtFiveFeet;

    const spaceInFeet = squaresAtFiveFeet * FEET_PER_SQUARE;
    const squares = spaceInFeet / gridDistance;

    // Tech Revolution pg. 108: a mech's space rounds down to the nearest value the
    // scale divides evenly, so a Huge mech fills one square at a 10 ft scale.
    if (isMech) return Math.max(1, Math.floor(squares));

    return squares;
}

/**
 * The size, in 5 ft squares, of the mech frame an actor has equipped. This is what a
 * mech's token is sized from, since the frame is what decides how much room it takes.
 *
 * @param {Actor} actor The actor the token stands for.
 * @returns {number|null} The frame's size in squares, or null if it has no usable frame.
 */
export function baseSquaresForFrame(actor) {
    const frame = actor?.items?.find(item => item.type === "mechFrame");
    return tokenSizes[frame?.system?.size] ?? null;
}

/**
 * How finely a token of this size needs to snap on a scene of this scale.
 *
 * Foundry rounds a token's size to the nearest half square before snapping it, so a token
 * a third of a square across is placed as though it were half a square across and cannot
 * step in thirds. A creature moves in 5 ft steps whatever the map's scale, so a token that
 * does not fill whole squares snaps to as many steps as the scale puts in one square.
 *
 * @param {number} sizeInSquares The token's size on this scene, in squares.
 * @param {number} gridDistance  The scene's grid distance in feet.
 * @returns {number|null} The snapping resolution, or null to leave the token to Foundry.
 */
export function snapResolution(sizeInSquares, gridDistance) {
    if (Number.isInteger(sizeInSquares)) return null;

    const steps = gridDistance / FEET_PER_SQUARE;
    if (!Number.isInteger(steps) || steps < 2) return null;

    return steps;
}
