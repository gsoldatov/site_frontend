import { SET_OBJECTS_TAGS_INPUT, SET_CURRENT_OBJECTS_TAGS, SELECT_OBJECTS, TOGGLE_OBJECT_SELECTION, DESELECT_OBJECTS, CLEAR_SELECTED_OBJECTS, 
    SET_OBJECTS_PAGINATION_INFO, SET_TAGS_FILTER, SET_TAGS_FILTER_INPUT, SET_SHOW_DELETE_DIALOG_OBJECTS, SET_OBJECTS_FETCH } from "../actions/objects";
import { getTagIDByName, getLowerCaseTagNameOrID } from "../store/state-util/tags";
import { resetObjectCaches, objectsGetCommonTagIDs } from "../store/state-util/ui-objects";


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
        const lowerCaseOldAddedTags = state.objectsUI.addedTags.map(t => getLowerCaseTagNameOrID(t));
        const at = (action.tagUpdates.added || []).map(tag => {     // replace tag names by ids if there is a match in local state
            if (typeof(tag) === "number") {
                if (lowerCaseOldAddedTags.includes(getLowerCaseTagNameOrID(state.tags[tag].tag_name))) return state.tags[tag].tag_name;    // If existing tag was added by tag_name, add it by tag name a second time
                return tag;
            }
            if (lowerCaseOldAddedTags.includes(getLowerCaseTagNameOrID(tag))) return tag;   // If existing tag was added by tag_name, add it by tag name a second time
            return getTagIDByName(state, tag) || tag;
        });
        if (at) {
            const lowerCaseAT = at.map(t => getLowerCaseTagNameOrID(t));
            newAddedTags = state.objectsUI.addedTags.slice();
            newAddedTags = newAddedTags.filter(t => !lowerCaseAT.includes(getLowerCaseTagNameOrID(t)));
            newAddedTags = newAddedTags.concat(at.filter(t => !lowerCaseOldAddedTags.includes(getLowerCaseTagNameOrID(t))));

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
    const newSelectedObjectIDs = state.objectsUI.selectedObjectIDs.includes(action.object_id) 
                                ? state.objectsUI.selectedObjectIDs.filter(object_id => object_id !== action.object_id)
                                : state.objectsUI.selectedObjectIDs.concat(action.object_id);
    
    const newShowDeleteDialog = newSelectedObjectIDs.length > 0 ? state.objectsUI.showDeleteDialog : false;     // Reset delete dialog if no objects are selected
                                
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: newSelectedObjectIDs,
            showDeleteDialog: newShowDeleteDialog
        }
    };
}

function deselectObjects(state, action) {
    const newSelectedObjectIDs = state.objectsUI.selectedObjectIDs.filter(object_id => !action.object_ids.includes(object_id));
    const newShowDeleteDialog = newSelectedObjectIDs.length > 0 ? state.objectsUI.showDeleteDialog : false;     // Reset delete dialog if no objects are selected

    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
}

function clearSelectedObjects(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: [],
            showDeleteDialog: false
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
                    tagsFilter: oPI.tagsFilter,     // tags filter is set in setTagsFilter action
                    currentPageObjectIDs: pI.currentPageObjectIDs !== undefined ? pI.currentPageObjectIDs : oPI.currentPageObjectIDs
            }
        }
    }
}

/*
    Adds/removes provided tag ID to/from objectsUI.paginationInfo.tagsFilter list.
    Clears the list if no tag ID is provided.
*/
function setTagsFilter(state, action) {
    let tagsFilter, oldTagsFilter = state.objectsUI.paginationInfo.tagsFilter;
    if (!action.tagID) tagsFilter = [];    // clear case
    else {  // add/remove case
        const i = oldTagsFilter.indexOf(action.tagID);
        if (i > -1) tagsFilter = oldTagsFilter.slice(0, i).concat(oldTagsFilter.slice(i + 1));
        else {
            tagsFilter = oldTagsFilter.slice();
            tagsFilter.push(action.tagID);
        }
    }
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            paginationInfo: {
                ...state.objectsUI.paginationInfo,
                tagsFilter
            }
        }
    };
}

function setTagsFilterInput(state, action) {
    const { inputText, matchingIDs } = action.tagsFilterInput;
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            tagsFilterInput: {
                inputText: inputText !== undefined ? inputText : state.objectsUI.tagsFilterInput.inputText,
                matchingIDs: matchingIDs !== undefined ? matchingIDs : state.objectsUI.tagsFilterInput.matchingIDs
            }
        }
    };
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
    SET_OBJECTS_TAGS_INPUT: setObjectsTagsInput,
    SET_CURRENT_OBJECTS_TAGS: setCurrentObjectsTags,
    SELECT_OBJECTS: selectObjects,
    TOGGLE_OBJECT_SELECTION: toggleObjectSelection,
    DESELECT_OBJECTS: deselectObjects,
    CLEAR_SELECTED_OBJECTS: clearSelectedObjects,
    SET_OBJECTS_PAGINATION_INFO: setObjectsPaginationInfo,
    SET_TAGS_FILTER: setTagsFilter,
    SET_TAGS_FILTER_INPUT: setTagsFilterInput,
    SET_SHOW_DELETE_DIALOG_OBJECTS: setShowDeleteDialogObjects,
    SET_OBJECTS_FETCH: setObjectsFetch
};

export default root;
