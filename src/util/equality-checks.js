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


/**
 * Returns true if `a` contains the props as `b`, including nested subobjects.
 * Cyclic references are not checked.
 * 
 * Same non-object types and nulls are considered to have equal attributes.
 * Diffrent types and objects with different constructors are consiredered to have different attributes.
 * 
 */
export const hasEqualAttributes = (a, b) => {
    // Different types are considered to always have different attributes.
    if (typeof(a) !== typeof(b)) return false;

    // Non-object types are considered to always have the same attributes.
    if (typeof(a) !== "object") return true;

    // Handle nulls as a separate case (they can't be passed to Object.keys)
    if (a === null && b === null) return true;
    if (a === null && b !== null) return false;
    if (a !== null && b === null) return false;

    // Objects with different constructors are considered 
    if (a.constructor !== b.constructor) return false;

    // Consider arrays to always have the same keys (they may have different keys de-facto, if their lengths are not equal)
    if (a instanceof Array) return true;

    // Check attributes keys
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (!deepEqual(keysA, keysB)) return false;

    // Recursively check each attribute
    for (let i = 0; i < keysA.length; i++)
        if (!hasEqualAttributes(a[keysA[i]], b[keysB[i]])) return false;
    
    return true;
};
