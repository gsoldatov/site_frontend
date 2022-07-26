/**
 * Returns a deep copy of the provided object `obj`.
 */
export const deepCopy = obj => {
    if (obj === null || typeof (obj) !== "object" || "isActiveClone" in obj)
        return obj;

    // Set
    if (obj instanceof Set) {
        var temp = new Set();
        temp["isActiveClone"] = null;
        obj.forEach(item => {
            temp.add(deepCopy(item));
        });
        delete obj["isActiveClone"];
    }

    else {
        if (obj instanceof Date)
            var temp = new obj.constructor();   // dates are handled separately to avoid conversion to string
        else
            var temp = obj.constructor();

        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {   // don't copy prototype props
                obj["isActiveClone"] = null;
                temp[key] = deepCopy(obj[key]);
                delete obj["isActiveClone"];
            }
        }
    }

    return temp;
};
