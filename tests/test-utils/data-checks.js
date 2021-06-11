/**
 * Returns true is 2 arrays are equal.
 */
export function compareArrays(a, b) {
    if (!(a instanceof Array && b instanceof Array)) throw new Exception("compareArrays received a non-array argument");
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}