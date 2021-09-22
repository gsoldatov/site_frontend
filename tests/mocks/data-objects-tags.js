import createStore from "../../src/store/create-store";
import { getNonCachedTags } from "../../src/fetches/data-tags";
import { setObjectsTags } from "../../src/actions/data-tags";
import { addObjects } from "../../src/actions/data-objects";
import { selectObjects } from "../../src/actions/objects";


/**
 * Creats a store with 2 selected objects in the state (for /objects page)
 */
export async function getStoreWithTwoSelectedObjects() {
    
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    let objects = [ { object_id: 1, object_type: "link", object_name: "object #1", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
                    is_published: false, owner_id: 1, current_tag_ids: [1, 2, 3, 4] },
                    { object_id: 2, object_type: "link", object_name: "object #2", object_description: "object description 2", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
                    is_published: false, owner_id: 1, current_tag_ids: [1, 2, 5, 6] } ];
    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(selectObjects([1, 2]));
    for (let object of objects)
        for (let tag_id of object.current_tag_ids)
            await store.dispatch(getNonCachedTags([tag_id]));
    // await store.dispatch(getNonCachedTags([6]));
    return store;
}