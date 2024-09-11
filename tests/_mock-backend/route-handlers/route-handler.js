export class RouteHandler {
    constructor(backend, { route, method, getResponseParams, getResponse }) {
        this.backend = backend;

        this.route = route;                                 // route the handler is assigned to
        this.method = method;                               // HTTP method handler is assigned to
        this.getResponseParams = getResponseParams || {};   // configurable response params for default response generator
        this._getResponse = getResponse.bind(this);         // default response generator
        this.throwNetworkError = false;                     // if true, handler will throw a network error

        this.customResponse = null;         // overridable static response object
        this._getCustomResponse = null;    // overridable (via setCustomResponseFunction method)
    }

    /**
     * Generates a response for the provided `requestBody` and `URL`.
     * @param {object} requestContext - `RequestContext` instance with the context of current request.
     * @returns fetch response object with `status` and optional `body` attributes.
     */
    processRequest(requestContext) {
        if (this.throwNetworkError) throw TypeError("NetworkError");   // Network errors are instances of TypeError
        
        let response = this.customResponse ? this.customResponse :
            this._getCustomResponse ? this._getCustomResponse(requestContext) : this._getResponse(requestContext);
        
        return response;
    }

    /**
     * Overrides default response generator with `fn`.
     */
    setCustomResponseFunction(fn) {
        this._getCustomResponse = fn.bind(this);
    }

    /**
     * Removes custom response generator from the handler.
     */
    clearCustomResponseFunction () {
        this._getCustomResponse = null;
    }
}
