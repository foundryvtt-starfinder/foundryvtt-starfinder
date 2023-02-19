
/**
 * @class
 * Helper class to transform shortform ability names back and forth between their full names.
 */
export default class CheckNameHelper {
    /**
     * Take the full name for a check, and return the 3-letter identifier
     * @param {String} fullName The full name for the check, such as "life-science" or "acrobatics"
     * @returns {String} The 3-letter name, if it exists, otherwise the inputted full name
     */
    static shortFormName(fullName) {
        return {
            "acrobatics": "acr",
            "athletics": "ath",
            "bluff": "blu",
            "computers": "com",
            "culture": "cul",
            "diplomacy":"dip",
            "disguise": "dis",
            "engineering":"eng",
            "intimidate": "int",
            "life-science":"lsc",
            "medicine": "med",
            "mysticism": "mys",
            "perception": "per",
            "profession": "pro",
            "physical-science":"phs",
            "piloting": "pil",
            "sense-motive":"sen",
            "sleight-of-hand":"sle",
            "stealth": "ste",
            "survival": "sur",

            "fortitude": "fort",
            "reflex": "reflex",
            "will": "will",

            "strength": "str",
            "dexterity": "dex",
            "constitution": "con",
            "intelligence": "int",
            "wisdom": "wis",
            "charisma": "cha",

            "caster-level": "caster-level"
        }[fullName] || fullName;
    }

    /**
     * Take the 3-letter identifier for a check, and return the full name
     * @param {String} threeLetter The 3-letter identifier  for the check, such as "lsc" or "acr"
     * @returns {String} The full name, if it exists, otherwise the inputted 3-letter name
     */
    static longFormName(threeLetter) {
        return {
            "acr": "acrobatics",
            "ath": "athletics",
            "blu": "bluff",
            "com":"computers",
            "cul": "culture",
            "dip": "diplomacy",
            "dis": "disguise",
            "eng": "engineering",
            "int": "intimidate",
            "lsc": "life-science",
            "med": "medicine",
            "mys": "mysticism",
            "per": "perception",
            "pro": "profession",
            "phs": "physical-science",
            "pil": "piloting",
            "sen": "sense-motive",
            "sle": "sleight-of-hand",
            "ste": "stealth",
            "sur": "survival",

            "fort": "fortitude",
            "reflex": "reflex",
            "will": "will",

            "caster-level": "caster-level"
        }[threeLetter] || threeLetter;
    }

    /**
     * Same as longformName, but a seperate function to stop namespace collision between the "int" of intimidate and intelligence
     * @see longFormName
     */
    static longFormNameAbilities(threeLetter) {
        return {
            "str": "strength",
            "dex": "dexterity",
            "con": "constitution",
            "int": "intelligence",
            "wis": "wisdom",
            "cha": "charisma"
        }[threeLetter] || threeLetter;
    }
}
