/**
 * Returns true if `a` is deeply equal to `b` (cyclic references are not checked).
 */
export const deepEqual = (a, b) => {
    // Check if types are the same
    if (typeof(a) !== typeof(b)) return false;

    // Types which can be directly compared
    if (["undefined", "string", "boolean", "bigint", "function"].includes(typeof(a))) return a === b;

    // Numbers (with additional check for NaN)
    if (typeof(a) === "number") return a === b || (isNaN(a) && isNaN(b));

    // Objects
    // Nulls
    if (a === null && b === null) return true;
    else if (a === null || b === null) return false;

    // Check if objects have the same constructors
    if (a.constructor !== b.constructor) return false;

    // Dates
    if (a instanceof Date) return a.getTime() === b.getTime()

    // Arrays
    if (a instanceof Array) {
        if (a.length !== b.length) return false;

        for (let i in a)
            if (!deepEqual(a[i], b[i])) return false;
        return true;
    }
    
    // General object check
    let keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;

    for (let k of keys)
        if (!deepEqual(a[k], b[k])) return false;
    return true;
};
