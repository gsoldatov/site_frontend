import { waitFor } from "@testing-library/react";

import type { MemoryHistory } from "history";


/**
 * Wrapper over browser history mock instance, implementing interactions with it.
 */
export class HistoryManager {
    history: MemoryHistory

    constructor(history: MemoryHistory) {
        this.history = history;
    }

    /**
     * Updates the current URL in the history
     */
    push(URL: string): void {
        this.history.push(URL);
    }

    /**
     * Ensures current history address matches provided `URL`.
     */
    ensureCurrentURL(URL: string): void {
        if (this.history.entries.length === 0) throw Error("Mock history is empty");
        expect(this.history.entries[this.history.length - 1].pathname).toBe(URL);
    }

    /**
     * Attempts to wait until specified `URL` becomes the last one in the history.
     */
    async waitForCurrentURLToBe(URL: string): Promise<void> {
        await waitFor(() => this.ensureCurrentURL(URL));
    }

    /**
     * Attempts to wait until current history address has URL and search params specified in `URLWithParams`
     */
    async waitForCurrentURLAndSearchParamsToBe(URLWithParams: string): Promise<void> {
        const [URL, params] = URLWithParams.split("?");
        await this.waitForCurrentURLToBe(URL);
        this.ensureCurrentURLParams(`?${params}`);
    }

    /**
     * Ensures current history URL query params matches the provided `params` string.
     * 
     * `params` must start from question mark, e.g.: `?tagIDs=1`
     * `decodeURIEncoding` can be set to true to decode (some) characters in URI encoded query params.
     */
    ensureCurrentURLParams(params: string, decodeURIEncoding: boolean = false): void {
        if (this.history.entries.length === 0) throw Error("Mock history is empty");
        
        let { search } = this.history.entries[this.history.entries.length - 1];
        if (decodeURIEncoding) {
            // decode required chars manually, because `decodeURIComponent` function is not working in test environment
            search = search.replace(/%252C/g, ",");
        }

        expect(search).toEqual(params);
    }

    /**
     * Returns current URL path
     */
    getCurrentURL(): string {
        return this.history.location.pathname;
    }

    /**
     * Returns the value of the provided URL search `param` from the current URL of the history
     */
    getCurrentURLSeachParam(param: string): string | null {
        const params = new URLSearchParams(this.history.location.search);
        return params.get(param);
    }

    /**
     * Returns string object ID from the current URL, if it contains one
     */
    getObjectID(): string {
        const URL = this.getCurrentURL();
        if (URL.startsWith("/objects/view/")) return URL.replace("/objects/view/", "");
        if (URL.startsWith("/objects/edit/")) return URL.replace("/objects/edit/", "");
        throw Error(`Attempted to get object ID from URL '${URL}'`);
    }
}
