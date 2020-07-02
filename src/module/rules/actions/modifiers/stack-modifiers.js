import StackModifiers from "../../closures/stack-modifiers.js";

/**
 * Take an array of modifiers and "stack" them according to the rules.
 * 
 * @param {Engine} engine The rules engine for the SFRPG system
 */
export default function (engine) {
    engine.closures.add("stackModifiers", StackModifiers);
}