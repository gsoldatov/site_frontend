import config from "../../src/config";
import { tagsHandlersList } from "./mock-fetch-handlers-tags";

export function mockFetch(URL, {
    method = "GET",
    headers = {},
    body = undefined
} = {}) {
    const URLPath = URL.replace(config["backendURL"], "");
    const handler = getHandler(URLPath, method);
    if (!handler) {
        throw new Error(`Fetch handler not found for URL "${URLPath}" and method "${method}".`);
    }
    return Promise.resolve(handler(body));
}

function getHandler(URL, method) {
    for (let list of [tagsHandlersList]) {
        let handlerContainer = list.get(URL);
        if (handlerContainer !== undefined && handlerContainer.hasOwnProperty(method)) {
            return handlerContainer[method];
        }
    }
}
