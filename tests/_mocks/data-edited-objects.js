import { resetEditedObjects, setEditedObject } from "../../src/actions/objects-edit";
import { updateEditedComposite } from "../../src/reducers/data/edited-objects";
import { addObjectsAttributes, addObjectsDataFromBackend } from "../../src/reducers/data/objects";
import { addObjectsTags } from "../../src/reducers/data/objects-tags";

import { createTestStore } from "../_util/create-test-store";
import { generateObjectAttributes, generateObjectData } from "./data-objects";


/**
 * Returns a store populated with composite & non-composite edited objects (without attribute, tag & data storages, except for 11).
 * Objects:
 * - 0: new composite with [-1, 10, 11] as children;
 * - 1: existing composite with [10, 12] as children;
 * - -1: new subobject link;
 * - 10, 11: existing links;
 * - 12: existing link not present in edited objects (& therefore, not added to the state);
 * - 21: existing link;
 * - 22: existing markdown;
 * - 23: existing to-do list;
 */
export const getStoreWithEditedObjects = () => {
    let { store } = createTestStore();

    store.dispatch(resetEditedObjects({ objectIDs: [0, 1, -1, /*10, 11,*/ /*12,*/ 21, 22, 23], allowResetToDefaults: true }));

    // 0: new composite with [-1, 10, 11] as children;
    store.dispatch(setEditedObject({ object_name: "new composite", object_type: "composite" }, 0));
    store.dispatch(updateEditedComposite(0, { command: "addNewSubobject", subobjectID: -1, column: 0, row: 0 }));
    store.dispatch(updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 10, column: 0, row: 1 }));
    store.dispatch(updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 11, column: 0, row: 2 }));
    
    // 1: existing composite with [10, 12] as children;
    store.dispatch(setEditedObject({ object_name: "existing composite", object_type: "composite" }, 1));
    store.dispatch(updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 10, column: 0, row: 1 }));
    store.dispatch(updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 12, column: 0, row: 2 }));

    // -1: new subobject link;
    store.dispatch(setEditedObject({ object_name: "new subobject" }, -1));

    // 12: existing link not present in edited objects (& therefore, not added to the state);

    // 21: existing link;
    store.dispatch(setEditedObject({ object_name: "existing link", object_type: "link" }, 21));

    // 22: existing markdown;
    store.dispatch(setEditedObject({ object_name: "existing markdown", object_type: "markdown" }, 22));

    // 23: existing to-do list;
    store.dispatch(setEditedObject({ object_name: "existing to-do list", object_type: "to_do_list" }, 23));

    // 10, 11: existing links (present in storages, 11 was modified)
    let objects = [
        generateObjectAttributes(10, { 
            object_type: "link", object_name: "existing subobject link", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), 
            is_published: false, owner_id: 1, current_tag_ids: [] 
        }),
        generateObjectAttributes(11, { 
            object_type: "link", object_name: "existing subobject link 2 (name before modification to unnamed)", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), 
            is_published: false, owner_id: 1, current_tag_ids: [] 
        })
    ];
    let objectData = [
        generateObjectData(10, "link", { "link": "https://test.link" }),
        generateObjectData(11, "link", { "link": "https://test.link" })
    ];

    store.dispatch(addObjectsAttributes(objects));
    store.dispatch(addObjectsTags(objects));
    store.dispatch(addObjectsDataFromBackend(objectData));

    store.dispatch(resetEditedObjects({ objectIDs: [10, 11] }));
    store.dispatch(setEditedObject({ object_name: "" }, 11));     // unnamed subobject

    return store;
};
