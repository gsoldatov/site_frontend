import config from "../../src/config";
import { resetTagsCache, tagsHandlersList } from "./mock-fetch-handlers-tags";
import { resetObjectsCaches, objectsHandlersList } from "./mock-fetch-handlers-objects";

let isFailingFetch, failMessage;
const handlerLists = [tagsHandlersList, objectsHandlersList];   // add new handler lists here

export function mockFetch(URL, {
    method = "GET",
    headers = {},
    body = undefined
} = {}) {
    if (isFailingFetch) {
        throw Error(failMessage);
    }

    const URLPath = URL.replace(config["backendURL"], "");
    const handler = getHandler(URLPath, method);
    if (!handler) {
        throw new Error(`Fetch handler not found for URL "${URLPath}" and method "${method}".`);
    }
    return Promise.resolve(handler(body));
}

export function resetMocks() {
    resetTagsCache();       // reset cache objects
    resetObjectsCaches();
    setFetchFailParams();   // reset fetch fail parameters
}

export function setFetchFailParams(iff = false, fm = "Test fetch failed") {
    isFailingFetch = iff;
    failMessage = fm;
}

function getHandler(URL, method) {
    for (let list of handlerLists) {
        let handlerContainer = list.get(URL);
        if (handlerContainer !== undefined && handlerContainer.hasOwnProperty(method)) {
            return handlerContainer[method];
        }
    }
}
