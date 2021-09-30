import config from "../../src/config";
import { resetTagsCache, tagsHandlersList } from "./mock-fetch-handlers-tags";
import { resetObjectsCaches, objectsHandlersList } from "./mock-fetch-handlers-objects";
import { authHandlersList } from "./mock-fetch-handlers-auth";
import { usersHandlersList } from "./mock-fetch-handlers-users";


let isFailingFetch;
const handlerLists = [authHandlersList, tagsHandlersList, objectsHandlersList, usersHandlersList];   // add new handler lists here

export function mockFetch(URL, {
    method = "GET",
    headers = {},
    body = undefined
} = {}) {
    if (isFailingFetch) {
        throw TypeError("NetworkError");   // Network errors are instances of TypeError
    }

    // Handle request
    const URLPath = URL.replace(config["backendURL"], "");
    const handler = getHandler(URLPath, method);
    if (!handler) throw new Error(`Fetch handler not found for URL "${URLPath}" and method "${method}".`);
    let response = handler(body);

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
}

export function resetMocks() {
    resetTagsCache();       // reset cache objects
    resetObjectsCaches();
    setFetchFail();   // reset fetch fail parameters
}

export function setFetchFail(iff = false) {
    isFailingFetch = iff;
}

function getHandler(URL, method) {
    for (let list of handlerLists) {
        let handlerContainer = list.get(URL);
        if (handlerContainer !== undefined && handlerContainer.hasOwnProperty(method)) {
            return handlerContainer[method];
        }
    }
}
