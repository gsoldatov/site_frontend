import { z } from "zod";

import type { RequestContext } from "./request-context";


/**
 * Mock backend's response object schema for route handlers
 */
export const responseSchema = z.object({
    status: z.number().int(),
    body: z.record(z.string(), z.any()).optional()
});

export type Response = z.infer<typeof responseSchema>;

/**
 * Logs requests sent to backend and generated responses.
 */
export class RequestHistory {
    log: RequestHistoryItem[]

    constructor() {
        this.log = [];
    }

    addRequest(requestContext: RequestContext, threwNetworkError: boolean, response?: Response): void {
        this.log.push(new RequestHistoryItem(requestContext, threwNetworkError, response));
    }

    getMatchingRequests(URLPath?: string, method?: string, responseStatus?: number, threwNetworkError?: boolean): RequestHistoryItem[] {
        let requests = this.log.concat();
        if (URLPath !== undefined) requests = requests.filter(r => r.requestContext.URLPath === URLPath);
        if (method !== undefined) requests = requests.filter(r => r.requestContext.method === method);
        if (responseStatus !== undefined) requests = requests.filter(r => r.response.status === responseStatus);
        if (threwNetworkError !== undefined) requests = requests.filter(r => r.threwNetworkError === threwNetworkError);
        return requests;

    }

    getMatchingRequestsCount(URLPath?: string, method?: string, responseStatus?: number, threwNetworkError?: boolean): number {
        return this.getMatchingRequests(URLPath, method, responseStatus, threwNetworkError).length;
    }
}


/**
 * Stores data about a single request.
 */
class RequestHistoryItem {
    requestContext: RequestContext
    response: Response
    threwNetworkError: boolean

    constructor(requestContext: RequestContext, threwNetworkError: boolean, response?: Response) {
        this.requestContext = requestContext;
        this.response = response || { status: -1 };
        this.threwNetworkError = threwNetworkError;
    }
}
