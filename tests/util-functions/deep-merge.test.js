import { deepCopy, deepMerge } from "../../src/util/copy";
import { deepEqual } from "../../src/util/equality-checks";


const _PRIMITIVES = ["str", 1, BigInt(9007199254740991), true, null, undefined];



test("Merge 2 primitives or nulls", () => {
    const values = _PRIMITIVES.slice();
    for (let a of values)
        for (let b of values) {
        expect(deepMerge(a, b)).toEqual(b);
    }
});


test("Merge object and a primitive or null", () => {
    const values = _PRIMITIVES.slice();
    for (let b of values) {
        expect(deepMerge({x: 1}, b)).toEqual(b);
    }
});


test("Merge collections", () => {
    // Array
    let a = [1, 2, 3];
    let b = _PRIMITIVES.slice();
    let mergeResult = deepMerge(a, b);
    expect(deepEqual(mergeResult, b)).toBeTruthy();
    
    // Set
    a = new Set(a), b = new Set(b);
    mergeResult = deepMerge(a, b);
    expect(deepEqual(mergeResult, b)).toBeTruthy();
});


test("Merge datetimes", () => {
    const a = new Date();
    let b = deepCopy(a);
    b.setDate(b.getDate() - 1);
    let mergeResult = deepMerge(a, b);
    expect(mergeResult.getTime()).toEqual(b.getTime());
});


test("Merge objects", () => {
    const a = {
        // Present in a only
        a1: 1, a2: { a21: 1 },

        // Present in both
        both1: 2, both2: "text", both3: new Set([1]),

        // Nested object (present in both)
        nested: {
            // Present in a only
            a1: 1,

            // Present in both
            both1: [1, 2, 3], both2: 1, 
            
            // Subobject with unique attribute
            both3: { a: 1 }
        }
    };

    const b = {
        // Present in both
        both1: null, both2: "other text", both3: new Set([2]),

        // Nested object (present in both)
        nested: {
            // Present in both
            both1: [3, 4, 5], both2: 2, 
            
            // Subobject with unique attribute
            both3: { b: 2 },

            // Present in b only
            b1: 1
        },
        
        // Present in b only
        b1: new Date(), b2: { b1: 1 }
    };

    let mergeResult = deepMerge(a, b);
    expect(deepEqual(mergeResult, {
        // Present in a only
        a1: 1, a2: { a21: 1 },

        // Present in both
        both1: null, both2: "other text", both3: new Set([2]),

        // Nested object (present in both)
        nested: {
            // Present in a only
            a1: 1,

            // Present in both
            both1: [3, 4, 5], both2: 2, both3: { a: 1, b: 2 },

            // Present in b only
            b1: 1
        },

        // Present in b only
        b1: b.b1, b2: { b1: 1 }

    })).toBeTruthy();
});
