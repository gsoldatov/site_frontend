import config from "../../src/config";
import { tagsHandlersList } from "./mock-fetch-handlers-tags";

let fetchFail = false;

export function mockFetch(URL, {
    method = "GET",
    headers = {},
    body = undefined
} = {}) {
    if (fetchFail) {
        return Promise.reject("Fetch failed");
    }
    const URLPath = URL.replace(config["backendURL"], "");
    const handler = getHandler(URLPath, method);
    if (!handler) {
        throw new Error(`Fetch handler not found for URL "${URLPath}" and method "${method}".`);
    }
    return Promise.resolve(handler(body));
}

export function setFetchFail(f) {
    fetchFail = f;
}

function getHandler(URL, method) {
    for (let list of [tagsHandlersList]) {
        let handlerContainer = list.get(URL);
        if (handlerContainer !== undefined && handlerContainer.hasOwnProperty(method)) {
            return handlerContainer[method];
        }
    }
}
