import type { State } from "../../types/store/state";
import type { ObjectsTags } from "../../types/store/data/objects-tags";

/**
 * Accepts a list of `objects` with `object_id` and `current_tag_ids` array, and sets the latter into state.objectsTags.
 */
export const addObjectsTags = (objects: ObjectWithCurrentTagIDs[]) => ({ type: "ADD_OBJECTS_TAGS", objects });

const _addObjectsTags = (state: State, action: { objects: ObjectWithCurrentTagIDs[] }): State => {
    const objectsTagsUpdate = action.objects.reduce((result, object) => {
        result[object.object_id] = object.current_tag_ids;
        return result;
    }, {} as ObjectsTags);

    return { ...state, objectsTags: {...state.objectsTags, ...objectsTagsUpdate }};
};


/**
 * Updates state.objectsTags for objects with ids `object_ids` by adding `added_tag_ids`
 * and removing `removed_tag_ids` from their tag lists.
 * 
 * If not tags are present in the state for a specific object, they will be set to `added_tag_ids`.
 */
export const updateObjectsTags = (object_ids: number[], added_tag_ids: number[], removed_tag_ids: number[]) => 
    ({ type: "UPDATE_OBJECTS_TAGS", object_ids, added_tag_ids, removed_tag_ids });

const _updateObjectsTags = (state: State, action: { object_ids: number[], added_tag_ids: number[], removed_tag_ids: number[] }): State => {
    const { object_ids, added_tag_ids, removed_tag_ids } = action;
    const objectsTagsUpdate = object_ids.reduce((result, object_id) => {
        const currentTags = state.objectsTags[object_id] || [];
        if (currentTags !== undefined) {
            const newTags = currentTags.filter(tag_id => !removed_tag_ids.includes(tag_id)).concat(added_tag_ids);
            result[object_id] = [...new Set(newTags)];
        }
        return result;
    }, {} as ObjectsTags);
    return { ...state, objectsTags: {...state.objectsTags, ...objectsTagsUpdate }};
};


export const objectsTagsRoot = {
    "ADD_OBJECTS_TAGS": _addObjectsTags,
    "UPDATE_OBJECTS_TAGS": _updateObjectsTags
};


type ObjectWithCurrentTagIDs = { object_id: number, current_tag_ids: number[] };
