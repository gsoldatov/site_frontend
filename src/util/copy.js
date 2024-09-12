/**
 * Returns a deep copy of the provided object `obj`.
 */
export const deepCopy = obj => {
    // Non-object, null and loop break
    if (obj === null || typeof (obj) !== "object" || "isActiveClone" in obj) return obj;

    // Set
    if (obj instanceof Set) {
        let result = new Set();
        result["isActiveClone"] = null;
        obj.forEach(item => {
            result.add(deepCopy(item));
        });
        delete obj["isActiveClone"];
        return result;
    }

    // Date
    if (obj instanceof Date) return new Date(obj);

    // Other objects
    let result = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {   // don't copy prototype props
            obj["isActiveClone"] = null;
            result[key] = deepCopy(obj[key]);
            delete obj["isActiveClone"];
        }
    }

    return result;
};
