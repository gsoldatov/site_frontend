import { getConfig } from "../../src/config";


/**
 * Stores request context.
 */
export class RequestContext {
    constructor(URL, fetchArgs) {
        const { method, headers, body } = fetchArgs;
        
        this.method = method || "GET";
        this.headers = headers || {};
        if (body) this.body = JSON.parse(fetchArgs.body);

        this.URLPath = URL.replace(getConfig()["backendURL"], "");
    }
}
