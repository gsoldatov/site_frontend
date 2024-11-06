import { BackendCache } from "./backend-cache/backend-cache";
import { BackendDataGenerator } from "./backend-data-generator";
import { RequestContext } from "./request-context";
import { RequestHistory } from "./request-history";

import { RouteHandler } from "./route-handlers/route-handler";
import { ObjectsRouteHandlers } from "./route-handlers/handlers/objects";
import { TagsRouteHandlers } from "./route-handlers/handlers/tags";
import { UsersRouteHandlers } from "./route-handlers/handlers/users";
import { SettingsRouteHandlers } from "./route-handlers/handlers/settings";

import type { FetchArgs, RouteHandlerResponse, Response } from "./types";


/**
 * Mock backend implementation
 */
export class MockBackend {
    cache: BackendCache
    data: BackendDataGenerator
    history: RequestHistory

    routeHandlers: {
        [index: string]: { [index: string]: RouteHandler | MockBackend },
        objects: ObjectsRouteHandlers,
        tags: TagsRouteHandlers,
        users: UsersRouteHandlers,
        settings: SettingsRouteHandlers
    }
    private _handlers: Record<string, Record<string, RouteHandler>>

    constructor() {
        this.cache = new BackendCache();
        this.data = new BackendDataGenerator(this);

        this.routeHandlers = {
            objects: new ObjectsRouteHandlers(this),
            tags: new TagsRouteHandlers(this),
            users: new UsersRouteHandlers(this),
            settings: new SettingsRouteHandlers(this)
        }

        this.history = new RequestHistory();
        
        // Map route handlers by path & method for an easier search
        const _handlers: Record<string, Record<string, RouteHandler>> = {};

        for (let group in this.routeHandlers) {
            for(let key in this.routeHandlers[group]) {
                const attr = this.routeHandlers[group][key];
                if (attr instanceof RouteHandler) {
                    if (!(attr.route in _handlers)) _handlers[attr.route] = {};
                    _handlers[attr.route][attr.method] = attr;
                }
            }
        }

        this._handlers = _handlers;

        this.fetch = this.fetch.bind(this);
    }

    /**
     * Mock `fetch` function.
     */
    fetch(URL: string, fetchArgs?: FetchArgs): Promise<Response> {
        const context = new RequestContext(URL, fetchArgs);
        
        // Generate a response
        const handler = (this._handlers[context.URLPath] || {})[context.method];
        if (!handler) throw Error(`Route handler for path '${context.URLPath}' and method '${context.method}' not found.`);
        
        try {
            let response = handler.processRequest(context);

            // Post-process response object & return it
            let fullResponse = this.postProcessResponse(response, context);
            this.history.addRequest(context, false, fullResponse);
            return Promise.resolve(fullResponse);
        } catch (e) {
            if (e instanceof TypeError && e.message === "NetworkError") this.history.addRequest(context, true);
            throw e;
        }
    }

    postProcessResponse(response: RouteHandlerResponse, requestContext: RequestContext): Response {
        const result: Response = {
            ...response,
            
            // Mock methods used by app 
            headers: { 
                get: header => {
                    if (header === "content-type") return "body" in response ? "application/json" : "";
                    return null;
                }
            },
            clone: () => ({ ...result }),

            text: () => Promise.resolve(JSON.stringify(result.body || "")),
            json: () => {
                if (!result.body) throw TypeError("Attempted to get JSON from a response without a body.");
                return Promise.resolve(result.body as Record<string, any>);
            }
        };

        // Add auth data (new token expiration time)
        if (result.status === 200 && "Authorization" in requestContext.headers && !requestContext.URLPath.startsWith("/auth/")
            && result.body !== undefined) {
            const expirationTime = new Date();
            expirationTime.setDate(expirationTime.getDate() + 10);
            result.body.auth = { access_token_expiration_time: expirationTime.toISOString() };
        }
        
        return result;
    }
}


/** 
 * Returns current `MockBackend` instance and narrows its type.
 */
export const getBackend = (): MockBackend => {
    const { backend } = (global as any as { backend: MockBackend });
    // Error will appear in old tests, which don't use backend, so type assertion without actual narrowing is used
    // if (!(backend instanceof MockBackend)) throw Error("Mock backend was not initialized.");
    return backend;
};
