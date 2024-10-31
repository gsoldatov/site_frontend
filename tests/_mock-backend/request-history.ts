import type { RequestContext } from "./request-context";
import type { RouteHandlerResponse } from "./types";

/**
 * Logs requests sent to backend and generated responses.
 */
export class RequestHistory {
    log: RequestHistoryItem[]

    constructor() {
        this.log = [];
    }

    addRequest(requestContext: RequestContext, threwNetworkError: boolean, response?: RouteHandlerResponse): void {
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
    response: RouteHandlerResponse
    threwNetworkError: boolean

    constructor(requestContext: RequestContext, threwNetworkError: boolean, response?: RouteHandlerResponse) {
        this.requestContext = requestContext;
        this.response = response || { status: -1 };
        this.threwNetworkError = threwNetworkError;
    }
}
