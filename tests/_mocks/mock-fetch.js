import { config } from "../../src/config";
import { resetTagsCache, tagsHandlersList } from "./mock-fetch-handlers-tags";
import { resetObjectsCaches, objectsHandlersList } from "./mock-fetch-handlers-objects";
import { authHandlersList } from "./mock-fetch-handlers-auth";
import { settingsHandlersList } from "./mock-fetch-handlers-settings";
import { usersHandlersList } from "./mock-fetch-handlers-users";


let isFailingFetch;
let customRouteResponses = [];
const handlerLists = [authHandlersList, tagsHandlersList, objectsHandlersList, settingsHandlersList, usersHandlersList];   // NOTE: add new handler lists here


export function mockFetch(URL, {
    method = "GET",
    headers = {},
    body = undefined
} = {}) {
    if (isFailingFetch) {
        throw TypeError("NetworkError");   // Network errors are instances of TypeError
    }
    const URLPath = URL.replace(config["backendURL"], "");

    // Lookup the fixed response
    let response = getCustomRouteResponse(URLPath, method, body);

    // Get default response, if a fixed one was not provided
    if (!response) {
        const handler = getHandler(URLPath, method);
        if (!handler) throw new Error(`Fetch handler not found for URL "${URLPath}" and method "${method}".`);
        response = handler(body);
    }

    // Prepare & return response object
    if (response.status === 200 && "Authorization" in headers && !URLPath.startsWith("/auth/")) {     // add token expiration time
        const expirationTime = new Date();
        expirationTime.setDate(expirationTime.getDate() + 10);
        response.body.auth = { access_token_expiration_time: expirationTime.toISOString() };
    }

    response.headers = { get: header => {
        if (header === "content-type") return "body" in response ? "application/json" : "";
        return undefined;
    }}

    response.clone = () => ({...response});
    if ("body" in response) response.json = () => Promise.resolve(response.body);

    return Promise.resolve(response);
};


export const resetMocks = () => {
    resetTagsCache();       // reset cache objects
    resetObjectsCaches();
    setFetchFail();   // reset fetch fail parameters
    customRouteResponses = [];
};


/**
 * Toggles mock fetch to return a network error.
 */
export const setFetchFail = (iff = false) => {
    isFailingFetch = iff;
};


/**
 * Overrides default mock fetch response for the provided `URL` and `method`. 
 * If multiple responses are added for the same `URL` & `method`, the last one will be used first.
 * 
 * Expects one of the following argument sets:
 * 1) `generator` - a function which accepts request `body` and default mock route `handler` and returns an object with `status` and, optionally, `body` properties;
 *     if `generator` response does not contain `status` or is not an object, next or default response is used instead;
 * 2) `status` and, optionally `body` arguments to be returned by the mock.
 */
export const addCustomRouteResponse = ( URL, method, { generator, status, body } = {}) => {
    customRouteResponses.unshift({ URL, method, generator, status, body });
};


/**
 * Removes custom fetch responses for the provided `URL` & `method`.
 */
export const clearCustomRouteResponse = (URL, method) => {
    customRouteResponses = customRouteResponses.filter(r => r.URL !== URL || r.method !== method);
};


/**
 * Returns a response object with status & body, if such were set for the provide combinantion of `URL` & `method`.
 * 
 * If a response generator was set, attempts to generate a response based on the provided request `body`. 
 * If response status and body are generated, returns them. Otherwise looks up the next generator or fixed response for the the `URL` and `method`.
 */
const getCustomRouteResponse = (URL, method, body) => {
    for (let r of customRouteResponses) {
        if (r.URL === URL && r.method === method) {
            // Response generator is provided
            if (r.generator !== undefined) {
                if (typeof(r.generator) !== "function") throw Error("Generator must be a function.");

                // Return a valid response object, if it was returned by the generator.
                const handler = getHandler(URL, method);
                const result = r.generator(body, handler);
                if (typeof(result) === "object" && result !== null && "status" in result) return result;
            }
            else {
                // Fixed response is provided
                const response = { status: r.status };
                if ("body" in r) response.body = r.body;
                return response;
            }
        }
    }
};


const getHandler = (URL, method) => {
    for (let list of handlerLists) {
        let handlerContainer = list.get(URL);
        if (handlerContainer !== undefined && handlerContainer.hasOwnProperty(method)) {
            return handlerContainer[method];
        }
    }
};
