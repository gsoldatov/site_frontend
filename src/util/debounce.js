import { enumDebounceDelayRefreshMode } from "./enum-debounce-delay-refresh-mode";

class DebounceRunner {
    constructor(func, delay, refreshDelayMode) {
        this.func = func;
        this.delay = delay;
        this.refreshDelayMode = refreshDelayMode;

        this.wasCalled = false;
        this.lastExecTime = new Date();
        this.lastExecTime.setTime(this.lastExecTime.getTime() - delay);
        this.timerID = null;

        this.abort = this.abort.bind(this);
        this.run = this.run.bind(this);
        this.triggerRun = this.triggerRun.bind(this);
    }

    abort() {
        clearTimeout(this.timerID);
        this.timerID = null;
    }

    async run(...params) {
        this.wasCalled = true;
        this.lastExecTime = new Date();
        this.timerID = null;
        await this.func(...params);     // works for synchronous func as well
    }

    triggerRun(...params) {
        // Set delay refresh on function call
        let refreshDelay = false;
        if (
            (this.refreshDelayMode === enumDebounceDelayRefreshMode.noRefreshOnFirstCall && this.wasCalled)
            || this.refreshDelayMode === enumDebounceDelayRefreshMode.onCall
        ) refreshDelay = true;
        
        // Delay is refreshed
        if (refreshDelay) {
            this.abort();
            this.timerID = setTimeout(this.run, this.delay, ...params);
        }

        // Delay is not refreshed
        else {
            let timeSinceLastExec = Date.now() - this.lastExecTime;

            if (timeSinceLastExec >= this.delay) this.run(...params);

            else {
                this.abort();
                this.timerID = setTimeout(this.run, this.delay - timeSinceLastExec, ...params);
            }
        }

        return this.abort;
    }
}


/**
 * Function wrapper, which limits the frequency of wrapped function calls and, optionally, adds an execution delay on function call.
 * 
 * @param {function} func - wrapped function.
 * @param {number} [delay=1000] - delay between calls in milliseconds (defaults to 1000 ms).
 * @param {string} [refreshDelayMode=noRefresh] - one of `enumDebounceDelayRefreshMode` values, indicating when first and subsequent
 * wrapped function calls are performed.
 * 
 * @returns {function} callback for clearing scheduled call of wrapped function.
 */
export default function debounce(func, delay = 1000, refreshDelayMode = enumDebounceDelayRefreshMode.noRefresh) {
    if (typeof(func) !== "function") throw TypeError("First argument must be a function.");
    if (typeof(delay) !== "number" || delay <= 0) throw TypeError("Delay must be a positive integer.");
    if (!(refreshDelayMode in enumDebounceDelayRefreshMode)) throw TypeError("Refresh mode must be an enumDebounceDelayRefreshMode value");

    let runner = new DebounceRunner(func, delay, refreshDelayMode);
    return runner.triggerRun;
};
