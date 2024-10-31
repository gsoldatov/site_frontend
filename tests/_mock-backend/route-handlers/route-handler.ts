import type { MockBackend } from "../mock-backend";
import type { RequestContext } from "../request-context";
import type { RouteHandlerResponse } from "../types";


export class RouteHandler {
    backend: MockBackend
    route: string
    method: string
    getResponseParams: object
    getResponse: (ctx: RequestContext) => RouteHandlerResponse
    throwNetworkError: boolean
    customResponse: RouteHandlerResponse | null
    _getCustomResponse: ((this: RouteHandler, ctx: RequestContext) => RouteHandlerResponse) | null


    constructor(backend: MockBackend, { route, method, getResponseParams, getResponse }:
        { route: string, method: string, getResponseParams?: object, getResponse: (ctx: RequestContext) => RouteHandlerResponse }
    ) {
        this.backend = backend;

        this.route = route;                                 // route the handler is assigned to
        this.method = method;                               // HTTP method handler is assigned to
        this.getResponseParams = getResponseParams || {};   // configurable response params for default response generator
        this.getResponse = getResponse.bind(this);         // default response generator
        this.throwNetworkError = false;                     // if true, handler will throw a network error

        this.customResponse = null;         // overridable static response object
        this._getCustomResponse = null;    // overridable (via setCustomResponseFunction method)
    }

    /**
     * Generates a response for the provided `requestBody` and `URL`.
     * @param {object} requestContext - `RequestContext` instance with the context of current request.
     * @returns fetch response object with `status` and optional `body` attributes.
     */
    processRequest(requestContext: RequestContext): RouteHandlerResponse {
        if (this.throwNetworkError) throw TypeError("NetworkError");   // Network errors are instances of TypeError
        
        let response = this.customResponse ? this.customResponse :
            this._getCustomResponse ? this._getCustomResponse(requestContext) : this.getResponse(requestContext);
        
        return response;
    }

    /**
     * Overrides default response generator with `fn`.
     */
    setCustomResponseFunction(fn: (ctx: RequestContext) => RouteHandlerResponse): void {
        this._getCustomResponse = fn.bind(this);
    }

    /**
     * Removes custom response generator from the handler.
     */
    clearCustomResponseFunction (): void {
        this._getCustomResponse = null;
    }
}
