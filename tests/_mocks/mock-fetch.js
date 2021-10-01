import config from "../../src/config";
import { resetTagsCache, tagsHandlersList } from "./mock-fetch-handlers-tags";
import { resetObjectsCaches, objectsHandlersList } from "./mock-fetch-handlers-objects";
import { authHandlersList } from "./mock-fetch-handlers-auth";
import { usersHandlersList } from "./mock-fetch-handlers-users";


let isFailingFetch;
let fixedRouteResponses = [];
const handlerLists = [authHandlersList, tagsHandlersList, objectsHandlersList, usersHandlersList];   // add new handler lists here


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
    let response = getFixedRouteResponse(URLPath, method);

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
    fixedRouteResponses = [];
};


/**
 * Toggles mock fetch to return a network error.
 */
export const setFetchFail = (iff = false) => {
    isFailingFetch = iff;
};


/**
 * Forces mock fetch to return provided `status` & `body` when a request is made with the combination of `URL` & `method`.
 * If multiple responses are added for the same `URL` & `method`, the last one will be used.
 */
export const addFixedRouteResponse = (URL, method, status, body) => {
    fixedRouteResponses.unshift({ URL, method, status, body });
};


/**
 * Removes overriden fetch responses for the provided `URL` & `method`.
 */
export const clearFixedRouteResponse = (URL, method) => {
    fixedRouteResponses = fixedRouteResponses.filter(r => r.URL !== URL || r.method !== method);
};


/**
 * Returns a response object with status & body, if such were set for the provide combinantion of `URL` & `method`.
 */
const getFixedRouteResponse = (URL, method) => {
    fixedRouteResponses.forEach(r => {
        if (r.URL === URL && r.method === method) {
            const response = { status: r.status };
            if ("body" in r) response.body = r.body;
            return response;
        }
    });
};


const getHandler = (URL, method) => {
    for (let list of handlerLists) {
        let handlerContainer = list.get(URL);
        if (handlerContainer !== undefined && handlerContainer.hasOwnProperty(method)) {
            return handlerContainer[method];
        }
    }
};
