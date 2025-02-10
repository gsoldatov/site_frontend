import { deepEqual } from "../../../src/util/equality-checks";


const _PRIMITIVES = ["str", 1, BigInt(9007199254740991), true, null, undefined];


test("Primitives of different types", () => {
    for (let i in _PRIMITIVES) {
        for (let j = i + 1; j < _PRIMITIVES.length; j++) {
            let a = _PRIMITIVES[i], b = _PRIMITIVES[j];
            expect(deepEqual(a, b)).toBeFalsy();
        }
    }
});


test("Same type privitives", () => {
    let a = "asd", b = "zxc";
    expect(deepEqual(a, b)).toBeFalsy();

    a = 1, b = 0;
    expect(deepEqual(a, b)).toBeFalsy();

    a = BigInt(1), b = BigInt(0);
    expect(deepEqual(a, b)).toBeFalsy();

    a = true, b = false;
    expect(deepEqual(a, b)).toBeFalsy();
    
    for (let i in _PRIMITIVES) {
        let a = _PRIMITIVES[i], b = a;
        expect(deepEqual(a, b)).toBeTruthy();
    }
});


test("Objects", () => {
    let a = null, b = null;
    expect(deepEqual(a, b)).toBeTruthy();

    a = {}, b = null;
    expect(deepEqual(a, b)).toBeFalsy();

    a = {x: 1}, b = {x: 1, y: 2};
    expect(deepEqual(a, b)).toBeFalsy();

    a = {x: 1}, b = {x: 2};
    expect(deepEqual(a, b)).toBeFalsy();

    a = {}, b = {};
    expect(deepEqual(a, b)).toBeTruthy();

    a = {x: 1}, b = {x: 1};
    expect(deepEqual(a, b)).toBeTruthy();

    // Order of keys does not matter
    a = {x: 1, y: 2}, b = {y: 2, x: 1};
    expect(deepEqual(a, b)).toBeTruthy();

    a = {x: 1, y: 2}, b = {y: 2, x: 0};
    expect(deepEqual(a, b)).toBeFalsy();
});


test("Dates", () => {
    let a = new Date(2001, 0, 1), b = null;
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Date(2001, 0, 1), b = new Date(a);
    b.setHours(1);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Date(2001, 0, 1), b = new Date(a);
    expect(deepEqual(a, b)).toBeTruthy();
});


test("Arrays", () => {
    let a = [], b = null;
    expect(deepEqual(a, b)).toBeFalsy();

    a = [], b = [1];
    expect(deepEqual(a, b)).toBeFalsy();

    a = [1], b = [2]
    expect(deepEqual(a, b)).toBeFalsy();

    a = [1, 2], b = [2, 1];
    expect(deepEqual(a, b)).toBeFalsy();

    a = [1], b = ["1"];
    expect(deepEqual(a, b)).toBeFalsy();

    a = [1, {x: 1}], b = [1, {x: 2}];
    expect(deepEqual(a, b)).toBeFalsy();

    a = [1, [1, 2]], b = [1, [1, 2, 3]];
    expect(deepEqual(a, b)).toBeFalsy();

    a = [], b = [];
    expect(deepEqual(a, b)).toBeTruthy();

    a = [1, 2], b = [1, 2];
    expect(deepEqual(a, b)).toBeTruthy();

    a = [{x: 1}], b = [{x: 1}];
    expect(deepEqual(a, b)).toBeTruthy();

    a = [1, [1, 2]], b = [1, [1, 2]];
    expect(deepEqual(a, b)).toBeTruthy();
});


test("Sets", () => {
    let a = new Set(), b = null;
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set(), b = new Set([1]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set([1]), b = new Set([2]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set([1]), b = new Set(["1"]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set(_PRIMITIVES), b = new Set(_PRIMITIVES);
    expect(deepEqual(a, b)).toBeTruthy();

    a = new Set([1, {x: 1}]), b = new Set([1, 2, 3]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set([1, {x: 1}]), b = new Set([1, null]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set([1, {x: 1}]), b = new Set([1, {x: 2}]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set([1, {x: 1}]), b = new Set([1, {x: 1, y: 2}]);
    expect(deepEqual(a, b)).toBeFalsy();

    a = new Set([1, {x: 1}]), b = new Set([{x: 1}, 1]);
    expect(deepEqual(a, b)).toBeTruthy();

    a = new Set([ new Set([ {x: 1} ]) ]), b = new Set([ new Set([ {x: 1} ]) ]);
    expect(deepEqual(a, b)).toBeTruthy();
});


test("Nested objects", () => {
    let a = {x: 1, y: [1, 2]}, b = {x: 1, y: [2, 1]};
    expect(deepEqual(a, b)).toBeFalsy();

    a = {x: 1, y: {}}, b = {x: {}, y: 1};
    expect(deepEqual(a, b)).toBeFalsy();

    a = {x: 1, y: {x: 1}}, b = {x: 1, y: {x: 2}};
    expect(deepEqual(a, b)).toBeFalsy();

    a = {x: 1, y: {x: [1, 2]}}, b = {x: 1, y: {x: [2, 1]}};
    expect(deepEqual(a, b)).toBeFalsy();

    a = {x: 1, y: [1, 2]}, b = {x: 1, y: [1, 2]};
    expect(deepEqual(a, b)).toBeTruthy();

    a = {x: 1, y: {x: 1}}, b = {x: 1, y: {x: 1}};
    expect(deepEqual(a, b)).toBeTruthy();

    a = {x: 1, y: [{x: 1}]}, b = {x: 1, y: [{x: 1}]};
    expect(deepEqual(a, b)).toBeTruthy();
});


test("Exclusions", () => {
    // Check if exclusions are propagated to `getInEqualAttributes`
    // (detailed exclusion options are checked in the test cases for that function).
    const a = {x: 1}, b = {x: 2};
    expect(deepEqual(a, b)).toBeFalsy();
    
    const exclusions = ["x"];
    expect(deepEqual(a, b, exclusions)).toBeTruthy();
});