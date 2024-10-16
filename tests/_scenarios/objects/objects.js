import { MockBackend } from "../../_mock-backend/mock-backend";

/**
 * Sets object `attributes` (including tags) & `data` for the specified `objectID`.
 */
export const setObject = (objectID, attributes, data) => {
    const { backend } = global;
    if (backend instanceof MockBackend) {
        backend.cache.objects.update(objectID, attributes, data);
    } else throw Error("Mock backend is unavailable.");
};
