/**
 * Returns a list of attribute paths in `a`, which are not equal to those in `b`,
 * where each path is a list of attribute names in top-down order.
 * 
 * `exclusions` may contain paths for attributes or list/set items or their subattributes,
 * which are excluded from comparison, e.g.:
 * - `x.y.z` will exclude `a.x.y.z` and its subattributes from comparison;
 * - `x.*.z` will exclude attribute `z` of every attribute of `a.x` (this can also be applied to array/set item checks).
 */
export const getInequalAttributes = (a: any, b: any, exclusions: string[][] = []): string[][] => {
    const inner = (a: any, b: any, currPath: string[]): string[][] => {
        // Exit if current path is excluded from the check
        const matchingExclusions = exclusions.filter(e => {
            if (currPath.length !== e.length) return false;
            for (let i = 0; i < e.length; i++)
                if (e[i] !== currPath[i] && e[i] !== "*") return false;
            return true;
        });
        if (matchingExclusions.length > 0) return [];

        // Check if types are the same
        if (typeof(a) !== typeof(b)) return [currPath];

        // Types which can be directly compared
        if (["undefined", "string", "boolean", "bigint", "function"].includes(typeof(a)))
            return a === b ? []: [currPath];

        // Numbers (with additional check for NaN)
        if (typeof(a) === "number")
            return (a === b || (isNaN(a) && isNaN(b))) ? [] : [currPath];

        // Objects
        // Nulls
        if (a === null && b === null) return [];
        else if (a === null || b === null) return [currPath];

        // Check if objects have the same constructors
        if (a.constructor !== b.constructor) return [currPath];

        // Dates
        if (a instanceof Date)
            return a.getTime() === b.getTime() ? [] : [currPath];

        // Arrays
        if (a instanceof Array) {
            if (a.length !== b.length) return [currPath];

            let result: string[][] = [];
            for (let i in a) {
                const childResult = inner(a[i], b[i], currPath.concat(i));
                if (childResult.length > 0) result = result.concat(childResult);
            }
            return result;
        }

        // Sets
        if (a instanceof Set) {
            if (a.size !== b.size) return [currPath];
            
            // Allow comparing elements of sets, but don't return their paths
            // (since they can't be directly addressed)
            const areEqual = [...a].every(valueA => {
                // Non-object valueA
                if (typeof(valueA) !== "object") return b.has(valueA);

                // Object valueA
                return [...b].some(valueB => inner(valueA, valueB, currPath.concat("*")).length === 0);
            });
            return areEqual ? [] : [currPath];
        }
        
        // General object check
        let keys = Object.keys(a);
        if (!(deepEqual(keys.sort(), Object.keys(b).sort()))) return [currPath];

        let result: string[][] = [];
        for (let k of keys) {
            const childResult = inner(a[k], b[k], currPath.concat(k));
            if (childResult.length > 0) result = result.concat(childResult);
        }
        return result;
    };

    return inner(a, b, []);
};


/**
 * Returns true if `a` is deeply equal to `b` (cyclic references are not supported).
 * 
 * NOTE: if this function is decoupled from `getInequalAttributes`, test cases of the latter must be updated.
 */
export const deepEqual = (a: any, b: any): boolean => {
    return getInequalAttributes(a, b, []).length === 0;
};


// /**
//  * Returns true if `a` is deeply equal to `b` (cyclic references are not supported).
//  * NOTE: this version works, but is replaced in favor or a wrapper over `getInequalAttributes`.
//  */
// export const deepEqual = (a: any, b: any): boolean => {
//     // Check if types are the same
//     if (typeof(a) !== typeof(b)) return false;

//     // Types which can be directly compared
//     if (["undefined", "string", "boolean", "bigint", "function"].includes(typeof(a))) return a === b;

//     // Numbers (with additional check for NaN)
//     if (typeof(a) === "number") return a === b || (isNaN(a) && isNaN(b));

//     // Objects
//     // Nulls
//     if (a === null && b === null) return true;
//     else if (a === null || b === null) return false;

//     // Check if objects have the same constructors
//     if (a.constructor !== b.constructor) return false;

//     // Dates
//     if (a instanceof Date) return a.getTime() === b.getTime()

//     // Arrays
//     if (a instanceof Array) {
//         if (a.length !== b.length) return false;

//         for (let i in a)
//             if (!deepEqual(a[i], b[i])) return false;
//         return true;
//     }

//     // Sets
//     if (a instanceof Set) {
//         if (a.size !== b.size) return false;

//         return [...a].every(valueA => {
//             // Non-object valueA
//             if (typeof(valueA) !== "object") return b.has(valueA);

//             // Object valueA
//             return [...b].some(valueB => deepEqual(valueA, valueB));
//         });
//     }
    
//     // General object check
//     let keys = Object.keys(a);
//     if (keys.length !== Object.keys(b).length) return false;

//     for (let k of keys)
//         if (!deepEqual(a[k], b[k])) return false;
//     return true;
// };


/**
 * Returns true if `a` contains the props as `b`, including nested subobjects.
 * Cyclic references are not supported.
 * 
 * Same non-object types and nulls are considered to have equal attributes.
 * Diffrent types and objects with different constructors are consiredered to have different attributes.
 * 
 */
export const hasEqualAttributes = (a: any, b: any) => {
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
