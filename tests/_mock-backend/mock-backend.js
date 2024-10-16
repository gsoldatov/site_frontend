import { BackendCache } from "./backend-cache/backend-cache";
import { BackendDataGenerator } from "./backend-data-generator";
import { RequestContext } from "./request-context";
import { RequestHistory } from "./request-history";

import { RouteHandler } from "./route-handlers/route-handler";
import { ObjectsRouteHandlers } from "./route-handlers/handlers/objects";
import { TagsRouteHandlers } from "./route-handlers/handlers/tags";
import { UsersRouteHandlers } from "./route-handlers/handlers/users";
import { SettingsRouteHandlers } from "./route-handlers/handlers/settings";


/**
 * Mock backend implementation
 */
export class MockBackend {
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
        const _handlers = {};

        Object.keys(this.routeHandlers).forEach(handlerGroup => {
            Object.keys(this.routeHandlers[handlerGroup]).forEach(key => {
                const attr = this.routeHandlers[handlerGroup][key];
                if (attr instanceof RouteHandler) {
                    if (!(attr.route in _handlers)) _handlers[attr.route] = {};
                    _handlers[attr.route][attr.method] = attr;
                }
            })
        });
        this._handlers = _handlers;

        this.fetch = this.fetch.bind(this);
    }

    /**
     * Mock `fetch` function.
     */
    fetch(URL, fetchArgs = {}) {
        const context = new RequestContext(URL, fetchArgs);
        
        // Generate a response
        const handler = (this._handlers[context.URLPath] || {})[context.method];
        if (!handler) throw Error(`Route handler for path '${context.URLPath}' and method '${context.method}' not found.`);
        
        try {
            let response = handler.processRequest(context);

            // Post-process response object & return it
            this.postProcessResponse(response, context);
            this.history.addRequest(context, response, false);
            return Promise.resolve(response);
        } catch (e) {
            if (e instanceof TypeError && e.message === "NetworkError") this.history.addRequest(context, undefined, true);
            throw e;
        }
    }

    postProcessResponse(response, requestContext) {
        // Add auth data (new token expiration time)
        if (response.status === 200 && "Authorization" in requestContext.headers && !requestContext.URLPath.startsWith("/auth/")) {
            const expirationTime = new Date();
            expirationTime.setDate(expirationTime.getDate() + 10);
            response.body.auth = { access_token_expiration_time: expirationTime.toISOString() };
        }

        // Add mock methods
        response.headers = { 
            get: header => {
                if (header === "content-type") return "body" in response ? "application/json" : "";
                return undefined;
            }
        };
    
        response.clone = () => ({ ...response });
        if ("body" in response) response.json = () => Promise.resolve(response.body);
    }
}
