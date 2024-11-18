import { SET_OBJECTS_LIST_TAGS_INPUT, SET_OBJECTS_LIST_CURRENT_TAGS, SELECT_OBJECTS, TOGGLE_OBJECT_SELECTION, CLEAR_SELECTED_OBJECTS, 
    SET_OBJECTS_LIST_TAGS_FILTER, SET_OBJECTS_LIST_TAGS_FILTER_INPUT, SET_OBJECTS_LIST_SHOW_DELETE_DIALOG } from "../actions/objects-list";
import { TagsSelectors } from "../store/selectors/data/tags";
import { TagsTransformer } from "../store/transformers/data/tags";
import { ObjectsListSelectors } from "../store/selectors/ui/objects-list";



/*
    Adds/removes provided tag ID to/from objectsListUI.paginationInfo.tagsFilter list.
    Clears the list if no tag ID is provided.
*/
function setObjectsListTagsFilter(state, action) {
    let tagsFilter, oldTagsFilter = state.objectsListUI.paginationInfo.tagsFilter;
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
        objectsListUI: {
            ...state.objectsListUI,
            paginationInfo: {
                ...state.objectsListUI.paginationInfo,
                tagsFilter
            }
        }
    };
}

function setObjectsListTagsFilterInput(state, action) {
    const { inputText, matchingIDs } = action.tagsFilterInput;
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            tagsFilterInput: {
                inputText: inputText !== undefined ? inputText : state.objectsListUI.tagsFilterInput.inputText,
                matchingIDs: matchingIDs !== undefined ? matchingIDs : state.objectsListUI.tagsFilterInput.matchingIDs
            }
        }
    };
}

function setShowDeleteDialogObjects(state, action) {
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            showDeleteDialog: action.showDeleteDialog
        }
    }
}


function setObjectsListTagsInput(state, action) {
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            tagsInput: {
                isDisplayed: action.tagsInput.isDisplayed !== undefined ? action.tagsInput.isDisplayed : state.objectsListUI.tagsInput.isDisplayed,
                inputText: action.tagsInput.inputText !== undefined ? action.tagsInput.inputText : state.objectsListUI.tagsInput.inputText,
                matchingIDs: action.tagsInput.matchingIDs !== undefined ? action.tagsInput.matchingIDs : state.objectsListUI.tagsInput.matchingIDs
            }
        }
    };
}

/*
    Updates addedTags & removedTagIDs in objectsListUI state.
    
    addedTags can be reset to an empty list (if an empty list is passed as value) or updated with a list of values. 
    In the second case, string values are replaced with corresponding tagIDs where possible. Existing values passed via action are removed from the new list.

    removedTagIDs can be reset to an empty list (if an empty list is passed as value) or updated with with a list of values.
    Existing values passed via action are removed from the new list.
*/
function setObjectsListCurrentTags(state, action) {
    let newAddedTags, newRemovedTagIDs, addedExistingTagIDs;

    if (action.tagUpdates.added instanceof Array && action.tagUpdates.added.length === 0) { // handle reset case
        newAddedTags = [];
    } else {    // handle general update case
        const lowerCaseOldAddedTags = state.objectsListUI.addedTags.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
        const at = (action.tagUpdates.added || []).map(tag => {     // replace tag names by ids if there is a match in local state
            if (typeof(tag) === "number") {
                if (lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(state.tags[tag].tag_name))) return state.tags[tag].tag_name;    // If existing tag was added by tag_name, add it by tag name a second time
                return tag;
            }
            if (lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(tag))) return tag;   // If existing tag was added by tag_name, add it by tag name a second time
            return TagsSelectors.getTagIDByName(state, tag) || tag;
        });
        if (at) {
            const lowerCaseAT = at.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
            newAddedTags = state.objectsListUI.addedTags.slice();
            newAddedTags = newAddedTags.filter(t => !lowerCaseAT.includes(TagsTransformer.getLowerCaseTagNameOrID(t)));
            newAddedTags = newAddedTags.concat(at.filter(t => !lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(t))));

            addedExistingTagIDs = newAddedTags.filter(t => ObjectsListSelectors.commonTagIDs(state).includes(t));  // move added tag IDs which are already present in the common tags into removed
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
            newRemovedTagIDs = state.objectsListUI.removedTagIDs.slice();

            // stop removing tags passed for the second time or added common tags already being removed
            let removedExistingTagIDs = addedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t));
            newRemovedTagIDs = newRemovedTagIDs.filter(t => !rt.includes(t) && !addedExistingTagIDs.includes(t));
            
            // remove tags passed for the first time or added common tags, which were not being removed
            newRemovedTagIDs = newRemovedTagIDs.concat(rt.filter(t => !state.objectsListUI.removedTagIDs.includes(t)));
            newRemovedTagIDs = newRemovedTagIDs.concat(removedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t)));
        }
    }

    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            addedTags: newAddedTags !== undefined ? newAddedTags : state.objectsListUI.addedTags,
            removedTagIDs: newRemovedTagIDs !== undefined ? newRemovedTagIDs : state.objectsListUI.removedTagIDs
        }
    };
}

function selectObjects(state, action) {
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            selectedObjectIDs: [...(new Set(state.objectsListUI.selectedObjectIDs.concat(action.object_ids)))]
        }
    }
}

function toggleObjectSelection(state, action) {
    const newSelectedObjectIDs = state.objectsListUI.selectedObjectIDs.includes(action.object_id) 
                                ? state.objectsListUI.selectedObjectIDs.filter(object_id => object_id !== action.object_id)
                                : state.objectsListUI.selectedObjectIDs.concat(action.object_id);
    
    const newShowDeleteDialog = newSelectedObjectIDs.length > 0 ? state.objectsListUI.showDeleteDialog : false;     // Reset delete dialog if no objects are selected
                                
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            selectedObjectIDs: newSelectedObjectIDs,
            showDeleteDialog: newShowDeleteDialog
        }
    };
}

function clearSelectedObjects(state, action) {
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            selectedObjectIDs: [],
            showDeleteDialog: false
        }
    };
}


const root = {
    SET_OBJECTS_LIST_TAGS_FILTER: setObjectsListTagsFilter,
    SET_OBJECTS_LIST_TAGS_FILTER_INPUT: setObjectsListTagsFilterInput,
    SET_OBJECTS_LIST_SHOW_DELETE_DIALOG: setShowDeleteDialogObjects,
    SET_OBJECTS_LIST_TAGS_INPUT: setObjectsListTagsInput,
    SET_OBJECTS_LIST_CURRENT_TAGS: setObjectsListCurrentTags,
    SELECT_OBJECTS: selectObjects,
    TOGGLE_OBJECT_SELECTION: toggleObjectSelection,
    CLEAR_SELECTED_OBJECTS: clearSelectedObjects
};

export default root;
