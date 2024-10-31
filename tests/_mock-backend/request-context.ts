import { getConfig } from "../../src/config";

import type { FetchArgs } from "./types";


/**
 * Stores request context.
 */
export class RequestContext {
    URLPath: string
    method: string
    headers: Record<string, string>
    body: object | undefined

    constructor(URL: string, fetchArgs?: FetchArgs) {
        const { method, headers, body } = fetchArgs || {};
        
        this.method = method || "GET";
        this.headers = headers || {};
        if (body) this.body = JSON.parse(body);

        this.URLPath = URL.replace(getConfig()["backendURL"], "");
    }
}
