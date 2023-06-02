import { waitFor } from "@testing-library/dom";

import debounce from "../../src/util/debounce";
import { enumDebounceDelayRefreshMode } from "../../src/util/enum-debounce-delay-refresh-mode";


/** Test class for monitoring function call times and arguments passed */
class CallMonitor {
    constructor() {
        this.calls = [];
        this.args = [];
        this.fn = this.fn.bind(this);
    }

    fn(arg) {
        this.calls.push(performance.now());
        this.args.push(arg);
    }
}


describe("Incorrect parameter values", () => {
    test.each([null, undefined, true, 1, "string", {}])("func value %s", (value) => {
        expect(() => { debounce(value); }).toThrow(/must be a function/);
    });
    
    
    test.each([null, true, "string", {}, -1, 0])("delay value %s", (value) => {
        const cm = new CallMonitor();
        expect(() => { debounce(cm.fn, value); }).toThrow(/must be a positive integer/);
    });


    test.each([null, true, "string", {}, -1, 1])("refresh delay mode value %s", (value) => {
        const cm = new CallMonitor();
        expect(() => { debounce(cm.fn, undefined, value); }).toThrow(/must be an enumDebounceDelayRefreshMode value/);
    });
});


describe("No refresh delay mode", () => {
    test("First call is performed instantly", () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 50;
        const debouncedFn = debounce(fn, delay);
        const time = performance.now();

        // Call a debounced function and check if it was executed instantly
        debouncedFn();
        expect(calls[0] - time).toBeLessThan(delay);
    });


    test("Subsequent calls are performed after fixed delay", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
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


    test("Function is called once with last set of args when called multiple times during a delay", async () => {
        const cm = new CallMonitor();
        const { fn, calls, args } = cm;
        const delay = 250, callAttemptInterval = 50;
        const debouncedFn = debounce(fn, delay);

        // Call function for the first time
        debouncedFn();
        const firstCallTime = performance.now();
        expect(calls.length).toEqual(1);

        // Attempt multiple function calls during a delay
        for (let i = 1; i <= 3; i++) {
            // Wait for a small interval of time to pass, then call debounced function
            const time = performance.now();
            await waitFor(() => {
                expect(performance.now() - time).toBeGreaterThanOrEqual(callAttemptInterval);
            }, { interval: callAttemptInterval });
            debouncedFn(i);
        }

        // Wait for wrapped function to be called and check that only a single call was made
        await waitFor(() => expect(performance.now() - firstCallTime).toBeGreaterThan(delay), { interval: callAttemptInterval });
        // await waitFor(() => expect(args.length).toEqual(2));
        expect(args.length).toEqual(2);
        expect(args[1]).toEqual(3);
    });


    test("Pending wrapped function call can be aborted", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
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


describe("No refresh on first call delay mode", () => {
    test("First call is performed instantly", () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 50;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.noRefreshOnFirstCall);
        const time = performance.now();

        // Call a debounced function and check if it was executed instantly
        debouncedFn();
        expect(calls[0] - time).toBeLessThan(delay);
    });


    test("Call delay is refreshed on subsequent calls before execution", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 250, callAttemptInterval = 50, numberOfCallAttempts = 3;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.noRefreshOnFirstCall);

        // Make first call
        debouncedFn();
        const secondCallTime = performance.now();

        // Make several delayed call attempts while there is a scheduled function call
        for (let i = 0; i < numberOfCallAttempts; i++) {
            const time = performance.now();
            await waitFor(() => {
                expect(performance.now() - time).toBeGreaterThanOrEqual(callAttemptInterval);
            }, { interval: callAttemptInterval });
            debouncedFn();
        }

        // Wait for function call to be performed
        const time = performance.now();
        await waitFor(() => expect(performance.now() - time).toBeGreaterThan(delay), { interval: callAttemptInterval });
        // await waitFor(() => expect(calls.length).toEqual(1), { interval: delay });
        expect(calls.length).toEqual(2);
        expect(calls[1] - secondCallTime).toBeGreaterThan(delay + numberOfCallAttempts * callAttemptInterval);
    });


    test("Function is called once with last set of args when called multiple times during a delay", async () => {
        const cm = new CallMonitor();
        const { fn, args } = cm;
        const delay = 250, callAttemptInterval = 50;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.noRefreshOnFirstCall);

        // Make first call
        debouncedFn();

        // Attempt multiple function calls during a delay
        for (let i = 1; i <= 3; i++) {
            // Call debounced function and wait for a small amount of time
            debouncedFn(i);

            const time = performance.now();
            await waitFor(() => {
                expect(performance.now() - time).toBeGreaterThanOrEqual(callAttemptInterval);
            }, { interval: callAttemptInterval });
        }


        // Wait for wrapped function to be called and check that only a single call was made
        const time = performance.now();
        await waitFor(() => expect(performance.now() - time).toBeGreaterThan(delay), { interval: callAttemptInterval });
        expect(args.length).toEqual(2);
        expect(args[1]).toEqual(3);
    });


    test("Pending wrapped function call can be aborted", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 50;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.noRefreshOnFirstCall);

        // Make first call (which is instantly performed)
        debouncedFn();

        // Call debounced function for and abort its pending execution
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


describe("Refresh delay on call mode", () => {
    test("First call is performed after delay", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 50;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.onCall);
        
        // Call a debounced function and check if it was executed after `delay`
        const time = performance.now();
        debouncedFn();

        await waitFor(() => expect(calls.length).toEqual(1), { interval: delay });
        // NOTE: perform rough comparison to avoid getting occasional errors
        expect(calls[0] - time).toBeGreaterThanOrEqual(delay - 1);
    });


    test("Call delay is refreshed on subsequent calls before execution", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 250, callAttemptInterval = 50, numberOfCallAttempts = 3;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.onCall);

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


    test("Function is called once with last set of args when called multiple times during a delay", async () => {
        const cm = new CallMonitor();
        const { fn, args } = cm;
        const delay = 250, callAttemptInterval = 50;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.onCall);

        // Attempt multiple function calls during a delay
        for (let i = 1; i <= 3; i++) {
            // Call debounced function and wait for a small amount of time
            debouncedFn(i);

            const time = performance.now();
            await waitFor(() => {
                expect(performance.now() - time).toBeGreaterThanOrEqual(callAttemptInterval);
            }, { interval: callAttemptInterval });
        }


        // Wait for wrapped function to be called and check that only a single call was made
        const time = performance.now();
        await waitFor(() => expect(performance.now() - time).toBeGreaterThan(delay), { interval: callAttemptInterval });
        // await waitFor(() => expect(args.length).toEqual(2));
        expect(args.length).toEqual(1);
        expect(args[0]).toEqual(3);
    });


    test("Pending wrapped function call can be aborted", async () => {
        const cm = new CallMonitor();
        const { fn, calls } = cm;
        const delay = 50;
        const debouncedFn = debounce(fn, delay, enumDebounceDelayRefreshMode.onCall);

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
