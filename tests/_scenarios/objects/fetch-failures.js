import { MockBackend } from "../../_mock-backend/mock-backend";


/**
 * Adds a mock fetch failure for a specified list of `objectIDs` when fetching /objects/view.
 * Other objects are successfully returned.
 */
export const mockFetchFailForObjectsView = objectIDs => {
    const { backend } = global;
    if (backend instanceof MockBackend) {
        backend.routeHandlers.objects.view.setCustomResponseFunction(function (requestContext) {
            const { object_ids = [], object_data_ids = [] } = requestContext.body;
            if (object_ids.filter(id => objectIDs.includes(id)).length > 0 || object_data_ids.filter(id => objectIDs.includes(id)).length > 0) {
                throw TypeError("NetworkError");
            } else {
                return this.getResponse(requestContext);
            }
        });
    } else throw Error("Mock backend is unavailable.");
};


/**
 * Filters specific `objectIDs` from /objects/view response and returns 404 if no object and data are returned.
 */
export const addNonExistingObjectsForObjectsView = objectIDs => {
    const { backend } = global;
    if (backend instanceof MockBackend) {
        backend.routeHandlers.objects.view.setCustomResponseFunction(function (requestContext) {
            let { object_ids = [], object_data_ids = [] } = requestContext.body;
            object_ids = object_ids.filter(id => !objectIDs.includes(id));
            object_data_ids = object_data_ids.filter(id => !objectIDs.includes(id));

            if (object_data_ids.length === 0 && object_data_ids.length === 0) return { status: 4040, body: { _error: "Objects not found." }};

            requestContext = { ...requestContext, body: {
                ...requestContext.body, object_ids, object_data_ids
            }};

            return this.getResponse(requestContext);
        });
    } else throw Error("Mock backend is unavailable.");
};
