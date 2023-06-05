import { hasEqualAttributes as h } from "../../src/util/equality-checks";


const _PRIMITIVES = ["str", 1, BigInt(9007199254740991), true, null, undefined];
const _SAME_TYPE_PRIMITIVES = [["a", "b"], [1, 2], [BigInt(9007199254740991), BigInt(9007199254740992)], 
    [true, false], [null, null], [undefined, undefined]];


test("Primitives of different types", () => {
    for (let i in _PRIMITIVES) {
        for (let j = i + 1; j < _PRIMITIVES.length; j++) {
            let a = _PRIMITIVES[i], b = _PRIMITIVES[j];
            expect(h(a, b)).toBeFalsy();
        }
    }
});


test("Nulls", () => {
    expect(h({}, null)).toBeFalsy();
    expect(h(null, {})).toBeFalsy();
    expect(h(null, null)).toBeTruthy();
});


test("Same type privitives", () => {
    for (let x of _PRIMITIVES) expect(h(x, x)).toBeTruthy();
});


test("Objects with different constructors", () => {
    const objects = [{}, [], new Set(), new Date()];

    for (let i = 0; i < objects.length - 1; i++)
        for (let j = i + 1; j < objects.length; j++)
            expect(h(objects[i], objects[j])).toBeFalsy();
});


test("Objects", () => {
    // Different & same attribute names
    expect(h({y: 1, x: 2}, {x: 1, z: 3})).toBeFalsy();
    expect(h({y: 1, x: 2}, {x: 2, y: 3})).toBeTruthy();
    expect(h({}, {})).toBeTruthy();

    // Arrays, sets, dates
    expect(h([1, 2], [1])).toBeTruthy();
    expect(h(new Set([1, 2]), new Set([1]))).toBeTruthy();
    expect(h(new Date(), new Date())).toBeTruthy();

    // Attributes of different types
    for (let i in _PRIMITIVES)
        for (let j = i + 1; j < _PRIMITIVES.length; j++) {
            let a = { x: _PRIMITIVES[i] }, b = { x: _PRIMITIVES[j] };
            expect(h(a, b)).toBeFalsy();
        }
    
    // Attributes of same types
    for (let [a, b] of _SAME_TYPE_PRIMITIVES) expect(h({x: a}, {x: b})).toBeTruthy();
});


test("Nested objects", () => {
    let a = { x: { x1: 2 }, y: 1 }, b = { x: { x2: 1 }, y: 2 };
    expect(h(a, b)).toBeFalsy();

    a = { x: {}, y: 1 }, b = { x: [], y: 2 };
    expect(h(a, b)).toBeFalsy();

    a = { x: { x1: true }, y: 1 }, b = { x: { x1: "a" }, y: 2 };
    expect(h(a, b)).toBeFalsy();

    a = { x: { x1: "a" }, y: 1 }, b = { x: { x1: "b" }, y: 2 };
    expect(h(a, b)).toBeTruthy();
});
