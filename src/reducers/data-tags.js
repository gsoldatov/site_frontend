import { ADD_TAGS, DELETE_TAGS, SET_OBJECTS_TAGS } from "../actions/data-tags";
import { tagAttributes } from "../store/state-templates/tags";
import { deepCopy } from "../util/copy";


function addTags(state, action) {
    let newTags = {}, nameIDMap = {};
    action.tags.forEach(tag => {
        const tag_id = tag.tag_id;
        newTags[tag_id] = {};
        tagAttributes.forEach(attr => newTags[tag_id][attr] = tag[attr]);
        nameIDMap[tag.tag_name.toLowerCase()] = tag.tag_id;
    });

    let newState = {
        ...state,
        tags: {
            ...state.tags,
            ...newTags
        }
    };

    // Replace string added tags in state.objectsListUI.addedTags, which have the same name as one of the added tags
    let k = 0, addedTags = deepCopy(state.objectsListUI.addedTags);
    for (let i = 0; i < addedTags.length; i++) {
        if (typeof(addedTags[i]) === "string") {
            const loweredTagName = addedTags[i].toLowerCase();
            if (nameIDMap[loweredTagName] !== undefined) {
                addedTags[i] = nameIDMap[loweredTagName]
                k++;
            }
        }
    }

    if (k > 0) newState = { ...newState, objectsListUI: { ...newState.objectsListUI, addedTags }};

    // Replace string added tags in state.editedObjects, which have the same name as one of the added tags
    k = 0;
    let editedObjects = {};
    Object.keys(newState.editedObjects).forEach(objectID => {
        let o = newState.editedObjects[objectID], addedTags = deepCopy(o.addedTags), kk = 0;
        for (let i = 0; i < addedTags.length; i++) {
            if (typeof(addedTags[i]) === "string") {
                const loweredTagName = addedTags[i].toLowerCase();
                if (nameIDMap[loweredTagName] !== undefined) {
                    addedTags[i] = nameIDMap[loweredTagName]
                    k++;
                    kk++;
                }
            }
        }
        editedObjects[objectID] = kk > 0 ? { ...o, addedTags } : o;
    });

    if (k > 0) newState = { ...newState, editedObjects };

    return newState;
};

function deleteTags(state, action) {
    let tags = {...state.tags};
    for (let tagID of action.tag_ids) {
        delete tags[tagID];
    }

    let objectsTags = {};
    Object.keys(state.objectsTags).forEach(objectID => {
        let tagIDs = state.objectsTags[objectID].filter(id => !action.tag_ids.includes(id));
        if (tagIDs.length > 0) objectsTags[objectID] = tagIDs;
    });

    return {
        ...state,
        tags: tags,
        objectsTags: objectsTags
    };
}

/*
    Updates objectsTags store.
    
    Receives a list of {object_id, ...} like objects and updates the tags for the object_id.
    
    Update option 1: {...} part contains current_tag_ids list => objectsTags[object_id] is overwritten to current_tag_ids.

    Update option 2: {...} part contains tag_updates object with added_tag_ids and/or removed_tag_ids lists in it
                     => objectsTags[object_id] is updated from those lists, while keeping the unchanged tags.
                     Existing tags from added_tag_ids and non-existing tags from removed_tag_ids are ignored.
*/
function setObjectsTags(state, action) {
    const objectsTags = action.objectsTags;
    const updates = {};
    objectsTags.forEach(object => {
        const object_id = object.object_id;
        if (object.current_tag_ids instanceof Array) updates[object_id] = object.current_tag_ids;
        else {
            const at = object.tag_updates.added_tag_ids || [];
            const rt = object.tag_updates.removed_tag_ids || [];

            updates[object_id] = state.objectsTags[object_id] || [];
            updates[object_id] = updates[object_id].filter(tagID => !rt.includes(tagID));
            updates[object_id] = updates[object_id].concat(at.filter(tagID => !updates[object_id].includes(tagID)));
        }
    })

    return {
        ...state,
        objectsTags: {...state.objectsTags, ...updates}
    };
}


const root = {
    ADD_TAGS: addTags,
    DELETE_TAGS: deleteTags,
    SET_OBJECTS_TAGS: setObjectsTags
};

export default root;