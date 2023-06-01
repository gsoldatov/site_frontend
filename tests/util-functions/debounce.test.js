import { waitFor } from "@testing-library/dom";

import debounce from "../../src/util/debounce";


/** List of timestamps for each `fn` call. */
var calls;
/** Function which records each call time in `calls` array. */
const fn = () => { calls.push(performance.now()); };


beforeEach(() => {
    calls = [];
});


describe("Incorrect parameter values", () => {
    test.each([null, undefined, true, 1, "string", {}])("func value %s", (value) => {
        expect(() => { debounce(value); }).toThrow(/must be a function/);
    });
    
    
    test.each([null, true, "string", {}, -1])("delay value %s", (value) => {
        expect(() => { debounce(fn, value); }).toThrow(/must be a positive integer/);
    });
});


describe("No refresh delay on call", () => {
    test("First call is performed instantly", () => {
        const delay = 50;
        const debouncedFn = debounce(fn, delay);
        const time = performance.now();

        // Call a debounced function and check if it was executed instantly
        debouncedFn();
        expect(calls[0] - time).toBeLessThan(delay);
    });


    test("Subsequent calls are performed after fixed delay", async () => {
        const delay = 250, callAttemptInterval = 50;
        const debouncedFn = debounce(fn, delay);

        // Call function for the first time
        debouncedFn();
        expect(calls.length).toEqual(1);

        // Run debounced calls
        for (let i = 1; i <= 2; i++){
            // Attempt to call during delay several times
            for (let j = 0; j < 3; j++) {
                // Wait for a small interval of time to pass, then call debounced function
                const time = performance.now();
                await waitFor(() => {
                    expect(performance.now() - time).toBeGreaterThanOrEqual(callAttemptInterval);
                }, { interval: callAttemptInterval });
                debouncedFn();
            }

            // Wait for wrapped function to be called and check it was called after initially specified delay
            await waitFor(() => expect(calls.length).toEqual(i + 1));
            const actualDelay = calls[i] - calls[i - 1];
            // NOTE: perform rough comparison to avoid getting occasional errors
            expect(actualDelay).toBeGreaterThanOrEqual(delay - 1);
            // NOTE: if `callAttemptInterval` is too small, the check below may fail, 
            // because the function call will be performed naturally after more than `callAttemptInterval` milliseconds.
            expect(actualDelay).toBeLessThan(delay + callAttemptInterval);
        }
    });


    test("Timed next wrapped function call can be aborted", async () => {
        const delay = 50;
        const debouncedFn = debounce(fn, delay);

        // Call function for the first time
        debouncedFn();
        expect(calls.length).toEqual(1);

        // Schedule a next delayed call and then abort it
        const abort = debouncedFn();
        abort();
        const time = performance.now();

        // Wait for delay to pass and check if wrapped function was not called
        await waitFor(() => {
            expect(performance.now() - time).toBeGreaterThanOrEqual(delay);
        }, { interval: delay });
        expect(calls.length).toEqual(1);
    });
});


describe("Enabled refresh delay on call", () => {
    test("First call is performed after delay", async () => {
        const delay = 50;
        const debouncedFn = debounce(fn, delay, true);
        
        // Call a debounced function and check if it was executed after `delay`
        const time = performance.now();
        debouncedFn();

        await waitFor(() => expect(calls.length).toEqual(1), { interval: delay });
        // NOTE: perform rough comparison to avoid getting occasional errors
        expect(calls[0] - time).toBeGreaterThanOrEqual(delay - 1);
    });


    test("Call delay is refreshed on subsequent calls before execution", async () => {
        const delay = 250, callAttemptInterval = 50, numberOfCallAttempts = 3;
        const debouncedFn = debounce(fn, delay, true);

        // Schedule a debounced call
        const firstCallTime = performance.now();
        debouncedFn();

        // Make several delayed call attempts while there is a scheduled function call
        for (let i = 0; i < numberOfCallAttempts; i++) {
            const time = performance.now();
            await waitFor(() => {
                expect(performance.now() - time).toBeGreaterThanOrEqual(callAttemptInterval);
            }, { interval: callAttemptInterval });
            debouncedFn();
        }

        // Wait for function call to be performed
        await waitFor(() => expect(calls.length).toEqual(1), { interval: delay });
        expect(calls[0] - firstCallTime).toBeGreaterThanOrEqual(delay + numberOfCallAttempts * callAttemptInterval);
    });


    test("Pending wrapped function call can be aborted", async () => {
        const delay = 50;
        const debouncedFn = debounce(fn, delay, true);

        // Call debounced function for and abort its pending execution
        const abort = debouncedFn();
        abort();
        const time = performance.now();

        // Wait for delay to pass and check if wrapped function was not called
        await waitFor(() => {
            expect(performance.now() - time).toBeGreaterThanOrEqual(delay);
        }, { interval: delay });
        expect(calls.length).toEqual(0);
    });
});
