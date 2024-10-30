/**
 * Returns a deep copy of the provided object `obj`.
 */
export const deepCopy = (obj: any): any => {
    // Non-object, null and loop break
    if (obj === null || typeof (obj) !== "object" || "isBeingCloned" in obj) return obj;

    // Set
    if (obj instanceof Set) {
        let result = new Set() as any;
        result["isBeingCloned"] = null;
        obj.forEach(item => {
            result.add(deepCopy(item));
        });
        if ("isBeingCloned" in obj) delete obj["isBeingCloned"];
        return result;
    }

    // Date
    if (obj instanceof Date) return new Date(obj);

    // Other objects
    let result = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {   // don't copy prototype props
            obj["isBeingCloned"] = null;
            result[key] = deepCopy(obj[key]);
            delete obj["isBeingCloned"];
        }
    }

    return result;
};


/**
 * Returns a deep copy of `a` with its attributes recursively merged with (replaced by) the attributes of `b`.
 */
export const deepMerge = (a: any, b: any): any => {
    // Merge different types
    if (typeof(a) !== typeof(b)) return deepCopy(b);

    // Merge same non-object types
    if (typeof(a) !== "object") return deepCopy(b);

    // Merge a with null
    if (b === null) return b;

    // Instances of different classes
    if (a.constructor !== b.constructor) return deepCopy(b);

    // Dates
    if (b instanceof Date) return deepCopy(b);

    // Collections
    if (b instanceof Array || b instanceof Set) return deepCopy(b);

    // Other objects
    const result = deepCopy(a);

    Object.keys(b).forEach(key => {
        if (key in a) result[key] = deepMerge(result[key], b[key]);
        else result[key] = deepCopy(b[key]);
    });

    return result;
};
