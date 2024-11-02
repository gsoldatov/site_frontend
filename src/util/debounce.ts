class DebounceRunner {
    private func: Function
    private delay: number
    private refreshDelayMode: DebounceDelayRefreshModes
    
    private wasCalled: boolean
    private lastExecTime: Date
    private timerID: TimerID | null

    constructor(func: Function, delay: number, refreshDelayMode: DebounceDelayRefreshModes) {
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
        clearTimeout(this.timerID as TimerID);
        this.timerID = null;
    }

    async run(...params: any[]) {
        this.wasCalled = true;
        this.lastExecTime = new Date();
        this.timerID = null;
        await this.func(...params);     // works for synchronous func as well
    }

    triggerRun(...params: any[]) {
        // Set delay refresh on function call
        let refreshDelay = false;
        if (
            (this.refreshDelayMode === "noRefreshOnFirstCall" && this.wasCalled)
            || this.refreshDelayMode === "onCall"
        ) refreshDelay = true;
        
        // Delay is refreshed
        if (refreshDelay) {
            this.abort();
            this.timerID = setTimeout(this.run, this.delay, ...params);
        }

        // Delay is not refreshed
        else {
            let timeSinceLastExec = Date.now() - this.lastExecTime.getTime();

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
 * @param {string} [refreshDelayMode=noRefresh] - debounce delay refresh mode for first and subsequent
 * wrapped function calls.
 * 
 * @returns {function} callback for clearing scheduled call of wrapped function.
 */
export default function debounce(func: Function, delay: number = 1000, refreshDelayMode: DebounceDelayRefreshModes = "noRefresh") {
    // if (delay === undefined) delay = 1000;
    // if (refreshDelayMode === undefined) refreshDelayMode = "noRefresh";
    if (typeof(func) !== "function") throw TypeError("First argument must be a function.");
    if (typeof(delay) !== "number" || delay <= 0) throw TypeError("Delay must be a positive integer.");
    if (!(["noRefresh", "noRefreshOnFirstCall", "onCall"].includes(refreshDelayMode))) throw TypeError(`Incorrect refreshDelayMode value: '${refreshDelayMode}'.`);

    let runner = new DebounceRunner(func, delay, refreshDelayMode);
    return runner.triggerRun;
};


type DebounceDelayRefreshModes = "noRefresh" | "noRefreshOnFirstCall" | "onCall";
type TimerID = ReturnType<typeof setTimeout>;
