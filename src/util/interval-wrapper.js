class IntervalRunner {
    constructor(func, interval, alwaysRunAfterInterval) {
        this.func = func;
        this.interval = interval;
        this.alwaysRunAfterInterval = alwaysRunAfterInterval;

        this.lastExecTime = new Date();
        this.lastExecTime.setTime(this.lastExecTime.getTime() - interval);
        this.timerID = null;

        this.run = this.run.bind(this);
        this.triggerRun = this.triggerRun.bind(this);
    }

    abort() {
        clearTimeout(this.timerID);
    }

    async run(...params) {
        this.lastExecTime = new Date();
        this.timerID = null;
        await this.func(...params);     // works for synchronous func as well
    }

    triggerRun(...params) {
        let timeSinceLastExec = Date.now() - this.lastExecTime;

        if (this.alwaysRunAfterInterval) {
            if (this.timerID) {
                clearTimeout(this.timerID);
            }
            this.timerID = setTimeout(this.run, this.interval, ...params);
        } else {
            if (timeSinceLastExec >= this.interval) {
                this.run(...params);
            } else if (!this.timerID) {
                this.timerID = setTimeout(this.run, this.interval - timeSinceLastExec, ...params);
            }            
        }

        return this.abort;
    }
}

/*
    Wraps the function to limit the maximum frequency of its calls and, optionally, add a delay before its execution.
    Parameters:
    - func - function being wrapped;
    - interval - minimal delay before func calls in ms;
    - alwaysRunAfterInterval - if true, func will be executed after the interval time since its last call has passed (including the situations when the func is called once); 
        otherwise it is run immediately on the first call and on the subsequnt calls which occured after the interval time since previous call has passed.
*/
export default function intervalWrapper(func, interval = 1000, alwaysRunAfterInterval = false) {
    if (typeof(func) !== "function") {
        throw TypeError("First argument must be a function.");
    }
    if (typeof(interval) !== "number" || interval < 0) {
        throw TypeError("Interval must be a positive integer.");
    }
    let runner = new IntervalRunner(func, interval, alwaysRunAfterInterval);
    return runner.triggerRun;
}
