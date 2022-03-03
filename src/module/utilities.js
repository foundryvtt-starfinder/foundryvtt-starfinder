export function generateUUID() {
    return ([1e7] + -1e3 + -4e3 + - 8e3 + -1e11).replace(/[018]/g, c => (
        c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export function degtorad(degrees) {
    return degrees * Math.PI / 180;
}

export function radtodeg(radians) {
    return radians / 180 * Math.PI;
}

/**
 * Determine if an array of terms contains a DiceTerm.
 * 
 * @param {RollTerm[]} terms The terms to check
 */
export function hasDiceTerms(terms) {
    for (const term of terms) {
        if (term instanceof DiceTerm) return true;
    }

    return false;
}
