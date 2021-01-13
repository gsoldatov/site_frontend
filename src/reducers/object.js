import { LOAD_ADD_OBJECT_PAGE, LOAD_EDIT_OBJECT_PAGE, SET_CURRENT_OBJECT, SET_OBJECT_TAGS_INPUT, SET_CURRENT_OBJECT_TAGS,
    SET_SHOW_DELETE_DIALOG_OBJECT, SET_MARKDOWN_DISPLAY_MODE, SET_OBJECT_ON_LOAD_FETCH_STATE, SET_OBJECT_ON_SAVE_FETCH_STATE
    } from "../actions/object";
import { getTagIDByName } from "../store/state-util";


function loadAddObjectPage(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            currentObject: {
                object_id: 0,
                object_type: "link",
                object_name: "",
                object_description: "",
                created_at: "",
                modified_at: "",

                currentTagIDs: [],
                addedTags: [],
                removedTagIDs: [],
                tagsInput: {
                    isDisplayed: false,
                    inputText: "",
                    matchingIDs: []
                },

                link: "",
                markdown: { raw_text: "", parsed: "" }
            },

            objectOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            objectOnSaveFetch: {
                isFetching: false,
                fetchError: ""
            }
        }
    };
}

function loadEditObjectPage(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            currentObject: {
                object_id: 0,
                object_type: "link",
                object_name: "",
                object_description: "",
                created_at: "",
                modified_at: "",

                currentTagIDs: [],
                addedTags: [],
                removedTagIDs: [],
                tagsInput: {
                    isDisplayed: false,
                    inputText: "",
                    matchingIDs: []
                },
                
                link: "",
                markdown: { raw_text: "", parsed: "" }
            },

            objectOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            objectOnSaveFetch: {
                isFetching: false,
                fetchError: ""
            },

            showDeleteDialog: false
        }
    };
}

function setCurrentObject(state, action) {
    let oldObject = state.objectUI.currentObject;
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            currentObject: {
                ...oldObject,
                object_id: action.object.object_id !== undefined ? action.object.object_id : oldObject.object_id,
                object_type: action.object.object_type !== undefined ? action.object.object_type : oldObject.object_type,
                object_name: action.object.object_name !== undefined ? action.object.object_name : oldObject.object_name,
                object_description: action.object.object_description !== undefined ? action.object.object_description : oldObject.object_description,
                created_at: action.object.created_at !== undefined ? action.object.created_at : oldObject.created_at,
                modified_at: action.object.modified_at !== undefined ? action.object.modified_at : oldObject.modified_at,

                link: action.object.link !== undefined ? action.object.link : oldObject.link,
                markdown: action.object.markdown !== undefined ? {...oldObject.markdown, ...action.object.markdown} : oldObject.markdown
            }
        }
    };
}

function setObjectTagsInput(state, action) {
    let oldObject = state.objectUI.currentObject;
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            currentObject: {
                ...oldObject,
                tagsInput: {
                    isDisplayed: action.tagsInput.isDisplayed !== undefined ? action.tagsInput.isDisplayed : oldObject.tagsInput.isDisplayed,
                    inputText: action.tagsInput.inputText !== undefined ? action.tagsInput.inputText : oldObject.tagsInput.inputText,
                    matchingIDs: action.tagsInput.matchingIDs !== undefined ? action.tagsInput.matchingIDs : oldObject.tagsInput.matchingIDs
                }
            }
        }
    }
}

/*
    Updates currentTagIDs, addedTags & removedTagIDs in currentObject state.
    currentTagIDs are set to provided currentTagIDs or remain unchanged if action.tagUpdates.currentTagIDs is undefined.
    
    addedTags can be reset to an empty list (if an empty list is passed as value) or updated with a list of values. 
    In the second case, string values are replaced with corresponding tagIDs where possible. Existing values passed via action are removed from the new list.

    removedTagIDs can be reset to an empty list (if an empty list is passed as value) or updated with with a list of values.
    Existing values passed via action are removed from the new list.
*/
function setCurrentObjectTags(state, action) {
    let oldObject = state.objectUI.currentObject;
    let newAddedTags, newRemovedTagIDs, addedExistingTagIDs;

    if (action.tagUpdates.added instanceof Array && action.tagUpdates.added.length === 0) { // handle reset case
        newAddedTags = [];
    } else {    // handle general update case
        const at = (action.tagUpdates.added || []).map(tag => {     // replace tag names by ids if there is a match in local state
            if (typeof(tag) === "number") return tag;
            return getTagIDByName(state, tag) || tag;
        });
        if (at) {
            newAddedTags = oldObject.addedTags.slice();
            newAddedTags = newAddedTags.filter(t => !at.includes(t));
            newAddedTags = newAddedTags.concat(at.filter(t => !oldObject.addedTags.includes(t)));

            addedExistingTagIDs = newAddedTags.filter(t => oldObject.currentTagIDs.includes(t));  // move added tag IDs which are already present in the current tags into removed
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
            newRemovedTagIDs = oldObject.removedTagIDs.slice();

            // stop removing tags passed for the second time or added common tags already being removed
            let removedExistingTagIDs = addedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t));
            newRemovedTagIDs = newRemovedTagIDs.filter(t => !rt.includes(t) && !addedExistingTagIDs.includes(t));
            
            // remove tags passed for the first time or added common tags, which were not being removed
            newRemovedTagIDs = newRemovedTagIDs.concat(rt.filter(t => !oldObject.removedTagIDs.includes(t)));
            newRemovedTagIDs = newRemovedTagIDs.concat(removedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t)));
        }
    }

    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            currentObject: {
                ...oldObject,
                currentTagIDs: action.tagUpdates.currentTagIDs ? action.tagUpdates.currentTagIDs : oldObject.currentTagIDs,
                addedTags: newAddedTags !== undefined ? newAddedTags : oldObject.addedTags,
                removedTagIDs: newRemovedTagIDs !== undefined ? newRemovedTagIDs : oldObject.removedTagIDs
            }
        }
    };
}

function setShowDeleteDialogObject(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            showDeleteDialog: action.showDeleteDialog
        }
    };
}

function setMarkdownDisplayMode(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            markdownDisplayMode: action.markdownDisplayMode
        }
    };
}

function setObjectOnLoadFetchState(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            objectOnLoadFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setObjectOnSaveFetchState(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            objectOnSaveFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}


const root = {
    LOAD_ADD_OBJECT_PAGE: loadAddObjectPage,
    LOAD_EDIT_OBJECT_PAGE: loadEditObjectPage,
    SET_CURRENT_OBJECT: setCurrentObject,
    SET_OBJECT_TAGS_INPUT: setObjectTagsInput,
    SET_CURRENT_OBJECT_TAGS: setCurrentObjectTags,
    SET_SHOW_DELETE_DIALOG_OBJECT: setShowDeleteDialogObject,
    SET_MARKDOWN_DISPLAY_MODE: setMarkdownDisplayMode,
    SET_OBJECT_ON_LOAD_FETCH_STATE: setObjectOnLoadFetchState,
    SET_OBJECT_ON_SAVE_FETCH_STATE: setObjectOnSaveFetchState
};

export default root;