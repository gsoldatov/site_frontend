/**
 * Enumeration for `debounce` function's `refreshDelayMode` argument.
 * 
 * @readonly
 * @enum {string}
 */
export const enumDebounceDelayRefreshMode = {
    /** 
     * First call is executed immediately, each subsequent is performed immediately, if `delay` time has passed since last call,
     * or is scheduled for execution at that time mark, otherwise.
     * 
     * If multiple calls with different arguments are attempted during a single delay, only the last one will be performed.
     */
    noRefresh: "noRefresh",

    /** 
     * First call is executed immediately, subsequent calls will be performed after `delay` time has passed since last call attempt. 
     * 
     * If multiple calls with different arguments are attempted during a single delay, only the last one will be performed.
     */
    noRefreshOnFirstCall: "noRefreshOnFirstCall",

    /**
     *  All calls are performed after `delay` time has passed since last call attempt.
     * 
     * If multiple calls with different arguments are attempted during a single delay, only the last one will be performed.
     */
    onCall: "onCall"
};
