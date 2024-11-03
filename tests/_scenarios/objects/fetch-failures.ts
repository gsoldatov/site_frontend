import { getBackend } from "../../_mock-backend/mock-backend";
import { objectsViewBody } from "../../_mock-backend/route-handlers/handlers/objects";

import type { RequestContext } from "../../_mock-backend/request-context";
import type { RouteHandler } from "../../_mock-backend/route-handlers/route-handler";


/**
 * Adds a mock fetch failure for a specified list of `objectIDs` when fetching /objects/view.
 * Other objects are successfully returned.
 */
export function mockFetchFailForObjectsView(this: RouteHandler, objectIDs: number[]) {
    const backend = getBackend();

    backend.routeHandlers.objects.view.setCustomResponseFunction(function (this: RouteHandler, requestContext: RequestContext) {
        const { object_ids = [], object_data_ids = [] } = objectsViewBody.parse(requestContext.body);
        if (object_ids.filter(id => objectIDs.includes(id)).length > 0 || object_data_ids.filter(id => objectIDs.includes(id)).length > 0) {
            throw TypeError("NetworkError");
        } else {
            return this.getResponse(requestContext);
        }
    });
};


/**
 * Filters specific `objectIDs` from /objects/view response and returns 404 if no object and data are returned.
 */
export function addNonExistingObjectsForObjectsView(this: RouteHandler, objectIDs: number[]) {
    const backend = getBackend();

    backend.routeHandlers.objects.view.setCustomResponseFunction(function (this: RouteHandler, requestContext: RequestContext) {
        let { object_ids = [], object_data_ids = [] } = objectsViewBody.parse(requestContext.body);
        object_ids = object_ids.filter(id => !objectIDs.includes(id));
        object_data_ids = object_data_ids.filter(id => !objectIDs.includes(id));

        if (object_data_ids.length === 0 && object_data_ids.length === 0) return { status: 4040, body: { _error: "Objects not found." }};

        requestContext = { ...requestContext, body: {
            ...requestContext.body, object_ids, object_data_ids
        }};

        return this.getResponse(requestContext);
    });
};
