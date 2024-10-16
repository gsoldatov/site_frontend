/**
 * Logs requests sent to backend and generated responses.
 */
export class RequestHistory {
    constructor() {
        this.log = [];
    }

    addRequest(requestContext, response, threwNetworkError) {
        this.log.push(new RequestHistoryItem(requestContext, response, threwNetworkError));
    }

    getMatchingRequests(URLPath, method, responseStatus, threwNetworkError) {
        let requests = this.log.concat();
        if (URLPath !== undefined) requests = requests.filter(r => r.requestContext.URLPath === URLPath);
        if (method !== undefined) requests = requests.filter(r => r.requestContext.method === method);
        if (responseStatus !== undefined) requests = requests.filter(r => r.response.status === responseStatus);
        if (threwNetworkError !== undefined) requests = requests.filter(r => r.threwNetworkError === threwNetworkError);
        return requests;

    }

    getMatchingRequestsCount(URLPath, method, responseStatus, threwNetworkError) {
        return this.getMatchingRequests(URLPath, method, responseStatus, threwNetworkError).length;
    }
}


/**
 * Stores data about a single request.
 */
class RequestHistoryItem {
    constructor(requestContext, response, threwNetworkError) {
        this.requestContext = requestContext;
        this.response = response || {};
        this.threwNetworkError = threwNetworkError;
    }
}
