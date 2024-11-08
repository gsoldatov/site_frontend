import type { State } from "../../store/types/state";
import type { Tag, Tags } from "../../store/types/data/tags";
import type { EditedObjects } from "../../store/types/data/edited-objects";
import type { ObjectsTags } from "../../store/types/data/objects-tags";


/**
 * Adds provided `tags` to state.tags,
 * replaces string tags in state.editedObjects & state.objectsList.addedTags with corresponding tag ids which match them.
 */
export const addTags = (tags: Tag[]) => ({ type: "ADD_TAGS", tags });

const _addTags = (state: State, action: { tags: Tag[] }): State => {
    // state.tags updates
    const newTags = action.tags.reduce((result, tag) => {
        result[tag.tag_id] = tag;
        return result;
    }, {} as Tags);
    let newState =  { ...state, tags: { ...state.tags, ...newTags }};

    // string tag => tag_id map
    const nameIDMap = action.tags.reduce((result, tag) => {
        result[tag.tag_name.toLowerCase()] = result.tag_id;
        return result;
    }, {} as Record<string, number>);

    // state.objectsList.addedTags updates
    let updatedCount = 0;
    const addedTags = state.objectsListUI.addedTags.map(tagNameOrID => {
        if (typeof(tagNameOrID) === "string") {
            const lowerCase = tagNameOrID.toLowerCase();
            if (nameIDMap[lowerCase] !== undefined) {
                updatedCount++;
                return nameIDMap[lowerCase] 
            } else return tagNameOrID;
        } else return tagNameOrID;
    });

    if (updatedCount > 0) newState = { ...newState, objectsListUI: { ...newState.objectsListUI, addedTags }};

    // state.editedObjects
    let editedObjects: EditedObjects = {};
    updatedCount = 0;
    Object.keys(newState.editedObjects).forEach(objectID => {
        const oid = objectID as any as number;
        let o = newState.editedObjects[oid], addedTags = o.addedTags.slice(), mappedTagsCount = 0;
        for (let i = 0; i < addedTags.length; i++) {
            const tag = addedTags[i];
            if (typeof(tag) === "string") {
                const loweredTagName = tag.toLowerCase();
                if (nameIDMap[loweredTagName] !== undefined) {
                    addedTags[i] = nameIDMap[loweredTagName]
                    mappedTagsCount++;
                    if (mappedTagsCount === 1) updatedCount++;
                }
            }
        }
        editedObjects[oid] = mappedTagsCount > 0 ? { ...o, addedTags } : o;
    });

    if (updatedCount > 0) newState = { ...newState, editedObjects };

    return newState;
};


export const deleteTags = (tag_ids: number[]) => ({ type: "DELETE_TAGS", tag_ids: tag_ids });

const _deleteTags = (state: State, action: { tag_ids: number[] }): State => {
    let tags = {...state.tags};
    for (let tagID of action.tag_ids) {
        delete tags[tagID];
    }

    let objectsTags: ObjectsTags = {};
    Object.keys(state.objectsTags).forEach(objectID => {
        const oid = objectID as any as number;
        let tagIDs = state.objectsTags[oid].filter(id => !action.tag_ids.includes(id));
        if (tagIDs.length > 0) objectsTags[oid] = tagIDs;
    });

    return {
        ...state,
        tags: tags,
        objectsTags: objectsTags
    };
}


export const tagsRoot = {
    "ADD_TAGS": _addTags,
    "DELETE_TAGS": _deleteTags
}