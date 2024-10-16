import { MockBackend } from "../../_mock-backend/mock-backend";

/**
 * Adds a multicolumn composite object with provided `objectID` and subobjects of each type and the following positions:
 * objectID + 1    objectID + 3   objectID + 5
 * objectID + 2    objectID + 4
 */
export const basicCompositeMulticolumnObject = objectID => {
    const { backend } = global;
    if (backend instanceof MockBackend) {
        backend.cache.objects.update(1, { object_type: "composite" }, { 
            display_mode: "multicolumn", subobjects: [
                { object_id: objectID + 1, column: 0, row: 0, is_expanded: true },
                { object_id: objectID + 2, column: 0, row: 1, is_expanded: false },
                { object_id: objectID + 3, column: 1, row: 0, is_expanded: true },
                { object_id: objectID + 4, column: 1, row: 1, is_expanded: false },
                { object_id: objectID + 5, column: 2, row: 0, is_expanded: true },
            ]});
        
        backend.cache.objects.update(objectID + 1, { object_type: "link" });
        backend.cache.objects.update(objectID + 2, { object_type: "markdown" });
        backend.cache.objects.update(objectID + 3, { object_type: "to_do_list" });
        backend.cache.objects.update(objectID + 4, { object_type: "composite" });
        backend.cache.objects.update(objectID + 5, { object_type: "link" });
    } else throw Error("Mock backend is unavailable.");
};
