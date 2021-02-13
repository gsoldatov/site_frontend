import createStore from "../../src/store/create-store";
import { addObjects, selectObjects, setObjectsTags } from "../../src/actions/objects";
import { getNonCachedTags } from "../../src/actions/tags";


// Creats a store with 2 selected objects in the state (for /objects page)
export async function getStoreWithTwoSelectedObjects() {
    
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    let objects = [ { object_id: 1, object_type: "link", object_name: "object #1", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4] },
                    { object_id: 2, object_type: "link", object_name: "object #2", object_description: "object description 2", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 5, 6] } ];
    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(selectObjects([1, 2]));
    await store.dispatch(getNonCachedTags([6]));
    return store;
}