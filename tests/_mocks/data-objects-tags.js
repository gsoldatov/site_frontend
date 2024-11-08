import { getNonCachedTags } from "../../src/fetches/data-tags";
import { addObjectsTags } from "../../src/reducers/data/objects-tags";
import { addObjects } from "../../src/actions/data-objects";
import { selectObjects } from "../../src/actions/objects-list";

import { generateObjectAttributes } from "./data-objects";
import { createTestStore } from "../_util/create-test-store";


/**
 * Creats a store with 2 selected objects in the state (for /objects/list page)
 */
export async function getStoreWithTwoSelectedObjects() {
    generateObjectAttributes
    
    let { store } = createTestStore();
    let objects = [ 
        generateObjectAttributes(1, {
            object_type: "link", object_name: "object #1", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1, current_tag_ids: [1, 2, 3, 4] 
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "object #2", object_description: "object description 2", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1, current_tag_ids: [1, 2, 5, 6] 
        })
    ];
    store.dispatch(addObjects(objects));
    store.dispatch(addObjectsTags(objects));
    store.dispatch(selectObjects([1, 2]));
    for (let object of objects)
        for (let tag_id of object.current_tag_ids)
            await store.dispatch(getNonCachedTags([tag_id]));
    // await store.dispatch(getNonCachedTags([6]));
    return store;
}