import { getConfig } from "../../src/config";


/**
 * Stores request context.
 */
export class RequestContext {
    URLPath: string
    method: string
    headers: Record<string, string>
    body: object | undefined

    constructor(URL: string, fetchArgs: { method?: string, headers?: Record<string, string>, body?: string }) {
        const { method, headers, body } = fetchArgs;
        
        this.method = method || "GET";
        this.headers = headers || {};
        if (body) this.body = JSON.parse(body);

        this.URLPath = URL.replace(getConfig()["backendURL"], "");
    }
}
