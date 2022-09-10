/**
 * Returns true is arrays `a` and `b` contain the same elements.
 */
export const compareArrays = (a, b) => {
    if (!(a instanceof Array && b instanceof Array)) throw new Exception("compareArrays received a non-array argument");
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) {
            if (isNaN(a[i]) && isNaN(b[i])) continue;
            else return false;
        }
    return true;
};


/**
 * Checks if years, months and date of the provided Date objects are equal.
 */
export const compareDates = (ed, dd) => {
    expect(ed.getFullYear()).toEqual(dd.getFullYear());
    expect(ed.getMonth()).toEqual(dd.getMonth());
    expect(ed.getDate()).toEqual(dd.getDate());
};
