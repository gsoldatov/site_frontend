import { ADD_TAGS, DELETE_TAGS, SET_OBJECTS_TAGS } from "../actions/data-tags";


const _tagAttributes = ["tag_id", "created_at", "modified_at", "tag_name", "tag_description"];
function addTags(state, action) {
    let newTags = {};
    action.tags.forEach(tag => {
        const tag_id = tag.tag_id;
        newTags[tag_id] = {};
        _tagAttributes.forEach(attr => newTags[tag_id][attr] = tag[attr]);
    });
    return {
        ...state,
        tags: {
            ...state.tags,
            ...newTags
        }
    };
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