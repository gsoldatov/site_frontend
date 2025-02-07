import { z } from "zod";
import { getInequalAttributes } from "../../../src/util/equality-checks";


const outputSchema = z.string().array().array();


expect.extend({
    /**
     * Compares `received` results of `getInequalAttributes` with `expected` list of paths (list of list of strings).
     */
    toHaveInequalAttributes(received, expected) {
        // Check inputs
        const receivedParse = outputSchema.safeParse(received);
        if (!(receivedParse.success)) throw new TypeError(`Invalid format of received data:\n${receivedParse.error}`);
        const expectedParse = outputSchema.safeParse(expected);
        if (!(expectedParse.success)) throw new TypeError(`Invalid format of expected data:\n${expectedParse.error}`);
        
        // Check lengths of arrays
        if (received.length !== expected.length) return {
            pass: false,
            message: () => "Array lengths do not match:\n" + JSON.stringify(expected) + "\n" + JSON.stringify(received)
        };

        // Check paths
        for (let i in expected)
            if (expected[i].join(".") !== received[i].join(".")) 
                return {
                    pass: false,
                    message: () => `Expected and received path at pos ${i} do not match:\n` + JSON.stringify(expected[i]) +
                            "\n" + JSON.stringify(received[i])
                };
        
        return { pass: true };
    }
});


/**
 * NOTE: test cases for `deepEqual` cover, whether `getInequalAttributes` returns (or not) paths correctly;
 * test cases in this file only check the structure of returned paths and `exclusions` property.
 */


describe("Basic output", () => {
    test("Primitives", () => {
        let a = "asd", b = "zxc";
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([[]]);
    
        a = "asd", b = "asd";
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([]);
    });
    
    
    test("Objects", () => {
        // Top-level
        let a = {}, b = {};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([]);
    
        a = {}, b = {x: 1};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([[]]);
        
        // Nested
        a = {x: {y: 1}}, b = {x: {y: 1}};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([]);
    
        a = {x: {y: 1}}, b = {x: {y: 2}};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["x", "y"]]);
    
        a = {x: {y: 1, z: 1}}, b = {x: {y: 1}};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["x"]]);
    
        a = {x: {y: {z: 1}}}, b = {x: {y: {z: 2}}}
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["x", "y", "z"]]);
    });
    
    
    test("Arrays", () => {
        // Top-level
        let a = [1, "a"], b = [1, "a"];
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([]);
    
        a = [1], b = [1, 2];
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([[]]);
    
        a = [1, "a"], b = [1, "b"];
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["1"]]);
        
        // Nested
        a = {x: [1, "a"]}, b = {x: [1, "b"]};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["x", "1"]]);
        
        // Objects as array items
        a = {x: [{y: {z: 1}}]}, b = {x: [{y: {z: 2}}]};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["x", "0", "y", "z"]]);
    });
    
    
    test("Sets", () => {
        // Sets of primitives
        let a = {s: new Set([1])}, b = {s: new Set([1])};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([]);
    
        a = {s: new Set([1])}, b = {s: new Set([1, 2])};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["s"]]);
        
        // Sets of objects
        a = {s: new Set([{x: 1}])}, b = {s: new Set([{x: 1}])};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([]);
    
        a = {s: new Set([{x: 1}])}, b = {s: new Set([{x: 2}])};
        expect(getInequalAttributes(a, b)).toHaveInequalAttributes([["s"]]);
    });
});


describe("Exclusions", () => {
    test("Top-level exclusion", () => {
        // Top-level excludes everything
        let a = {x: 1}, b = {y: 2}, exclusions = [[]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);

        a = "a", b = "b", exclusions = [[]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);
    });


    test("Top-level object attribute", () => {
        let a = {x: 1}, b = {x: 2}, exclusions = [];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x"]]);
    
        a = {x: 1}, b = {x: 2}, exclusions = [["x"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);
    });


    test("Nested object attributes", () => {
        // Nested objects are different
        let a = {x: {y: {z1: 1, z2: 2, z3: 3}}}, b = {x: {y: {z1: 1, z2: 22, z3: 33}}}, exclusions = [];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x", "y", "z2"], ["x", "y", "z3"]]);

        // Nested objects' differencies are partially excluded
        exclusions = [["x", "y", "z3"]]
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x", "y", "z2"]]);

        // Nested objects' differencies are excluded on their level
        exclusions = [["x", "y", "z2"], ["x", "y", "z3"]]
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);

        // Nested objects' differencies are excluded on parent level
        exclusions = [["x", "y"]]
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);
    });


    test("Asterisks in objects", () => {
        // Top-level asterisk excludes attribute comparison, if top-level attribute names are equal
        let a = {x: 1}, b = {x: 2}, exclusions = [["*"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);

        a = {x: 1}, b = {y: 2}, exclusions = [["*"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([[]]);
        
        // Nested asterisks exclude all attributes downwards, if attribute names on asterisk level are equal
        a = {x: {y: {z1: 1,  z2: 2}}};
        b = {x: {y: {z1: 11, z2: 22}}};
        exclusions = [["x", "y", "*"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);

        a = {x: {y: {z1: 1}}};
        b = {x: {y: {z2: 2}}};
        exclusions = [["x", "y", "*"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x", "y"]]);

        // Asterisks on intermediate positions allow exclusions of downward attributes, if attribute names on their level are equal
        a = {x: {y1: {z1: 1, z2: 2}, y2: {z1: 1, z2: 2}}};
        b = {x: {y1: {z1: 1, z2: 22}, y2: {z1: 11, z2: 2}}};
        exclusions = [["x", "*", "z1"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x", "y1", "z2"]]);

        a = {x: {y1: {z1: 1, z2: 2}, y2: {z1: 1, z2: 2}}};
        b = {x: {k1: {z1: 1, z2: 22}, y2: {z1: 11, z2: 2}}};
        exclusions = [["x", "*", "z1"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x"]]);

        // Multiple asterisks can be used
        a = {x: {y: { z1: {k1: 1},  z2: {k2: 2} }}};
        b = {x: {y: { z1: {k1: 11}, z2: {k2: 22} }}};
        exclusions = [["x", "*", "*", "k1"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x", "y", "z2", "k2"]]);
    });


    test("Asterisks in arrays", () => {
        // Asterisks in array exclude comparison of their items, if lengths of arrays are equal
        let a = {x: [1, 2, 3]}, b = {x: [3, 4, 5]}, exclusions = [["x", "*"]]
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);

        a = {x: [1]}, b = {x: [1, 2]}, exclusions = [["x", "*"]]
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x"]]);

        // Intermediate asterisks on the level of array items allows comparison of their items' attributes
        a = {x: [
            { y: 1, z: 1 },
            { y: 2, z: 2 }
        ]};
        b = {x: [
            { y: 0, z: 1 },
            { y: 2, z: 0 }
        ]};
        exclusions = [["x", "*", "z"]];
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x", "0", "y"]]);
    });


    test("Asterisks in sets", () => {
        // Asterisks in array exclude comparison of their items, if lengths of arrays are equal
        let a = {x: new Set([
            {y: 1, z: 1},
            {y: 2, z: 2}
        ])},
        b = {x: new Set([
            {y: 1, z: 11},
            {y: 2, z: 22}
        ])},
        exclusions = [["x", "*", "z"]]
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([]);

        // Any dirrefence in set elements results in set being inequal
        a = {x: new Set([
            {y: 1, z: 1},
            {y: 0, z: 2}
        ])},
        b = {x: new Set([
            {y: 1, z: 11},
            {y: 2, z: 22}
        ])},
        expect(getInequalAttributes(a, b, exclusions)).toHaveInequalAttributes([["x"]]);
    });
});
