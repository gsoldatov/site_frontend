import { ADD_OBJECTS, ADD_OBJECT_DATA, SET_OBJECTS_TAGS, SET_OBJECTS_TAGS_INPUT, SET_CURRENT_OBJECTS_TAGS,
    DELETE_OBJECTS, SELECT_OBJECTS, TOGGLE_OBJECT_SELECTION, DESELECT_OBJECTS, 
    CLEAR_SELECTED_OBJECTS, SET_OBJECTS_PAGINATION_INFO, SET_SHOW_DELETE_DIALOG_OBJECTS, SET_OBJECTS_FETCH } from "../actions/objects";
import { getTagIDByName, resetObjectCaches, objectsGetCommonTagIDs } from "../store/state-util";


const _objectAttributes = ["object_id", "object_type", "created_at", "modified_at", "object_name", "object_description"];
function addObjects(state, action) {
    let newObjects = {};
    action.objects.forEach(object => {
        const object_id = object.object_id;
        newObjects[object_id] = {};
        _objectAttributes.forEach(attr => newObjects[object_id][attr] = object[attr]);
    });
    return {
        ...state,
        objects: {
            ...state.objects,
            ...newObjects
        }
    };
};

function addObjectData(state, action) {
    let newLinks = {};

    for (let objectData of action.objectData){
        switch (objectData["object_type"]) {
            case "link":
                newLinks[objectData["object_id"]] = {...objectData["object_data"]};
                break;
            default:
                break;
        }
    }
    
    return {
        ...state,
        links: {
            ...state.links,
            ...newLinks
        }
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

function setObjectsTagsInput(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            tagsInput: {
                isDisplayed: action.tagsInput.isDisplayed !== undefined ? action.tagsInput.isDisplayed : state.objectsUI.tagsInput.isDisplayed,
                inputText: action.tagsInput.inputText !== undefined ? action.tagsInput.inputText : state.objectsUI.tagsInput.inputText,
                matchingIDs: action.tagsInput.matchingIDs !== undefined ? action.tagsInput.matchingIDs : state.objectsUI.tagsInput.matchingIDs
            }
        }
    };
}

/*
    Updates addedTags & removedTagIDs in objectsUI state.
    
    addedTags can be reset to an empty list (if an empty list is passed as value) or updated with a list of values. 
    In the second case, string values are replaced with corresponding tagIDs where possible. Existing values passed via action are removed from the new list.

    removedTagIDs can be reset to an empty list (if an empty list is passed as value) or updated with with a list of values.
    Existing values passed via action are removed from the new list.
*/
function setCurrentObjectsTags(state, action) {
    let newAddedTags, newRemovedTagIDs, addedExistingTagIDs;

    if (action.tagUpdates.added instanceof Array && action.tagUpdates.added.length === 0) { // handle reset case
        newAddedTags = [];
    } else {    // handle general update case
        const at = (action.tagUpdates.added || []).map(tag => {     // replace tag names by ids if there is a match in local state
            if (typeof(tag) === "number") return tag;
            return getTagIDByName(state, tag) || tag;
        });
        if (at) {
            newAddedTags = state.objectsUI.addedTags.slice();
            newAddedTags = newAddedTags.filter(t => !at.includes(t));
            newAddedTags = newAddedTags.concat(at.filter(t => !state.objectsUI.addedTags.includes(t)));

            addedExistingTagIDs = newAddedTags.filter(t => objectsGetCommonTagIDs(state).includes(t));  // move added tag IDs which are already present in the common tags into removed
            newAddedTags = newAddedTags.filter(t => !addedExistingTagIDs.includes(t));
        }
    }

    if (action.tagUpdates.removed instanceof Array && action.tagUpdates.removed.length === 0) { // handle reset case
        newRemovedTagIDs = [];
    } else {    // handle general update case
        let rt = action.tagUpdates.removed;
        if (rt || addedExistingTagIDs) {
            rt = rt || [];
            addedExistingTagIDs = addedExistingTagIDs || [];
            newRemovedTagIDs = state.objectsUI.removedTagIDs.slice();

            // stop removing tags passed for the second time or added common tags already being removed
            let removedExistingTagIDs = addedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t));
            newRemovedTagIDs = newRemovedTagIDs.filter(t => !rt.includes(t) && !addedExistingTagIDs.includes(t));
            
            // remove tags passed for the first time or added common tags, which were not being removed
            newRemovedTagIDs = newRemovedTagIDs.concat(rt.filter(t => !state.objectsUI.removedTagIDs.includes(t)));
            newRemovedTagIDs = newRemovedTagIDs.concat(removedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t)));
        }
    }

    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            addedTags: newAddedTags !== undefined ? newAddedTags : state.objectsUI.addedTags,
            removedTagIDs: newRemovedTagIDs !== undefined ? newRemovedTagIDs : state.objectsUI.removedTagIDs
        }
    };
}

function deleteObjects(state, action) {
    let objects = {...state.objects};
    let links = {...state.links};
    let objectsTags = {...state.objectsTags};
    for (let objectID of action.object_ids) {
        delete objects[objectID];
        delete links[objectID];
        delete objectsTags[objectID];
    }

    return {
        ...state,
        objects: objects,
        links: links,
        objectsTags: objectsTags
    };
}

function selectObjects(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: [...(new Set(state.objectsUI.selectedObjectIDs.concat(action.object_ids)))]
        }
    }
}

function toggleObjectSelection(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: state.objectsUI.selectedObjectIDs.includes(action.object_id) 
                            ? state.objectsUI.selectedObjectIDs.filter(object_id => object_id !== action.object_id)
                            : state.objectsUI.selectedObjectIDs.concat(action.object_id)
        }
    };
}

function deselectObjects(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: state.objectsUI.selectedObjectIDs.filter(object_id => !action.object_ids.includes(object_id))
        }
    };
}

function clearSelectedObjects(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: []
        }
    };
}

function setObjectsPaginationInfo(state, action) {
    let oPI = state.objectsUI.paginationInfo;
    let pI = action.paginationInfo;
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            paginationInfo: {
                    currentPage: pI.currentPage !== undefined ? pI.currentPage : oPI.currentPage,
                    itemsPerPage: pI.itemsPerPage !== undefined ? pI.itemsPerPage : oPI.itemsPerPage,
                    totalItems: pI.totalItems !== undefined ? pI.totalItems : oPI.totalItems,
                    sortField: pI.sortField !== undefined ? pI.sortField : oPI.sortField,
                    sortOrder: pI.sortOrder !== undefined ? pI.sortOrder : oPI.sortOrder,
                    filterText: pI.filterText !== undefined ? pI.filterText : oPI.filterText,
                    objectTypes: pI.objectTypes !== undefined ? pI.objectTypes: oPI.objectTypes,
                    currentPageObjectIDs: pI.currentPageObjectIDs !== undefined ? pI.currentPageObjectIDs : oPI.currentPageObjectIDs
            }
        }
    }
}

function setShowDeleteDialogObjects(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            showDeleteDialog: action.showDeleteDialog
        }
    }
}

function setObjectsFetch(state, action) {
    if (!action.isFetching) resetObjectCaches();
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            fetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    }
}


const root = {
    ADD_OBJECTS: addObjects,
    ADD_OBJECT_DATA: addObjectData,
    SET_OBJECTS_TAGS: setObjectsTags,
    SET_OBJECTS_TAGS_INPUT: setObjectsTagsInput,
    SET_CURRENT_OBJECTS_TAGS: setCurrentObjectsTags,
    DELETE_OBJECTS: deleteObjects,
    SELECT_OBJECTS: selectObjects,
    TOGGLE_OBJECT_SELECTION: toggleObjectSelection,
    DESELECT_OBJECTS: deselectObjects,
    CLEAR_SELECTED_OBJECTS: clearSelectedObjects,
    SET_OBJECTS_PAGINATION_INFO: setObjectsPaginationInfo,
    SET_SHOW_DELETE_DIALOG_OBJECTS: setShowDeleteDialogObjects,
    SET_OBJECTS_FETCH: setObjectsFetch
};

export default root;