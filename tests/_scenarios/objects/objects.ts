import { getBackend } from "../../_mock-backend/mock-backend";

import type { ObjectAttributes, ObjectDataUnion } from "../../_mock-data/modules/objects";


/**
 * Sets object `attributes` (including tags) & `data` for the specified `objectID`.
 */
export const setObject = (objectID: number, attributes: ObjectAttributes, data: ObjectDataUnion) => {
    const backend = getBackend();
    backend.cache.objects.update(objectID, attributes, data);
};
