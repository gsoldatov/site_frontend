import { deepCopy } from "../src/util/copy";
import { deepEqual } from "../src/util/equality-checks";


const _PRIMITIVES = ["str", 1, BigInt(9007199254740991), true, null, undefined];


describe("Deep copy", () => {
    test("Primitive types & null", () => {
        const values = _PRIMITIVES.slice();
        for (let v of values) {
            let copy = deepCopy(v);
            expect(v).toEqual(copy);
        }
    });


    test("Array", () => {
        const a = _PRIMITIVES.slice();
        let b = deepCopy(a);

        expect(b instanceof Array).toBeTruthy();
        expect(b.length).toEqual(a.length);
        for (let i in a) expect(a[i]).toEqual(b[i]);
    });

    
    test("Set", () => {
        let a = new Set(["a", "b", "c"]);
        let b = deepCopy(a);

        expect(b.size).toEqual(3);
        b.add("d");
        expect(b.size).toEqual(4);
        expect(a.size).toEqual(3);
    });


    test("Datetime", () => {
        const a = new Date();
        let b = deepCopy(a);
        expect(b instanceof Date).toBeTruthy();
        expect(a.getTime()).toEqual(b.getTime());
    });


    test("Object with primitive types & null as props", () => {
        const a = {
            str: "text",
            num: 123,
            bigInt_: BigInt(9007199254740991),
            bool: true,
            null_: null,
            undefined_: undefined
        };

        let b = deepCopy(a);
        expect(Object.keys(a).length).toEqual(Object.keys(b).length);
        for (let k in Object.keys(b)) expect(a[k]).toEqual(b[k]);
    });


    test("Nested object", () => {
        const a = {
            x: "text",
            y: 123,
            z: { a: true, b: {
                c: 345
            }}
        };

        let b = deepCopy(a);

        // Check if nested object's prop was copied
        expect(a.z.b.c).toEqual(b.z.b.c);

        // Check if nested objects were deeply copied        
        a.z.b.c = 0;
        expect(a.z.b.c).not.toEqual(b.z.b.c);
        
        a.z.newProp = true;
        expect(Object.keys(a.z).length).toEqual(Object.keys(b.z).length + 1);
    });


    test("Nested array", () => {
        const a = {
            x: 123,
            y: _PRIMITIVES.slice()
        };

        let b = deepCopy(a);

        // Check if nested array was copied
        expect(b.y instanceof Array).toBeTruthy();
        expect(b.y.length).toEqual(a.y.length);
        for (let k in a.y) expect(a.y[k]).toEqual(b.y[k]);

        // Check if nested array was copied to another object
        a.y.push("new value");
        expect(b.y.length).toEqual(a.y.length - 1);
    });


    test("Nested array of objects", () => {
        const a = {
            b: [
                {c: 1, d: 2},
                {x: [
                    {y: 1},
                    {z: 2}
                ]}
            ]
        };

        let b = deepCopy(a);

        // Check if object in nested array was deeply copied
        expect(Object.keys(a.b[0]).length).toEqual(Object.keys(b.b[0]).length);
        for (let k in a.b[0]) expect(a.b[0][k]).toEqual(b.b[0][k]);

        a.b[0].newProp = 123;
        expect(Object.keys(a.b[0]).length).toEqual(Object.keys(b.b[0]).length + 1);

        // Check if nested array of objects was deeply copied
        expect(a.b[1].x.length).toEqual(b.b[1].x.length);
        for (let i in a.b[1].x) {
            let objA = a.b[1].x[i], objB = b.b[1].x[i];
            expect(Object.keys(objA)).toEqual(Object.keys(objB));
            for (let k in objA) expect(objA[k]).toEqual(objB[k]);

            objA.newProp = 123;
            expect(Object.keys(objA).length).toEqual(Object.keys(objB).length + 1);
        }
    });
});


describe("Deep equal", () => {
    test("Primitives of ifferent types", () => {
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

        a = {x: 1}, {x: 1, y: 2};
        expect(deepEqual(a, b)).toBeFalsy();

        a = {x: 1}, b = {x: 2};
        expect(deepEqual(a, b)).toBeFalsy();

        a = {}, b = {};
        expect(deepEqual(a, b)).toBeTruthy();

        a = {x: 1}, b = {x: 1};
        expect(deepEqual(a, b)).toBeTruthy();
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
});
