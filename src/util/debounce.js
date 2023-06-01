class DebounceRunner {
    constructor(func, delay, refreshDelayOnCall) {
        this.func = func;
        this.delay = delay;
        this.refreshDelayOnCall = refreshDelayOnCall;

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
        this.lastExecTime = new Date();
        this.timerID = null;
        await this.func(...params);     // works for synchronous func as well
    }

    triggerRun(...params) {
        let timeSinceLastExec = Date.now() - this.lastExecTime;

        if (this.refreshDelayOnCall) {
            if (this.timerID) clearTimeout(this.timerID);
            this.timerID = setTimeout(this.run, this.delay, ...params);
        }
        
        else {
            if (timeSinceLastExec >= this.delay) this.run(...params);

            else if (!this.timerID) 
                this.timerID = setTimeout(this.run, this.delay - timeSinceLastExec, ...params);
        }

        return this.abort;
    }
}


/**
 * Function wrapper, which limits the frequency of wrapped function calls and, optionally, adds an execution delay on function call.
 * 
 * @param {function} func - wrapped function.
 * @param {number} [delay=1000] - delay between calls in milliseconds (defaults to 1000 ms).
 * @param {boolean} [refreshDelayOnCall=false] - if true, each wrapped function call will add or reset a delay before its execution; 
 * otherwise, a call will be performed immediately or scheduled to be performed when `delay` time since previous call has passed.
 * 
 * @returns {function} callback for clearing scheduled call of wrapped function.
 */
export default function debounce(func, delay = 1000, refreshDelayOnCall = false) {
    if (typeof(func) !== "function") {
        throw TypeError("First argument must be a function.");
    }
    if (typeof(delay) !== "number" || delay <= 0) {
        throw TypeError("Interval must be a positive integer.");
    }
    let runner = new DebounceRunner(func, delay, refreshDelayOnCall);
    return runner.triggerRun;
};
