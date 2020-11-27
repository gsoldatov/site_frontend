import { LOAD_ADD_OBJECT_PAGE, LOAD_EDIT_OBJECT_PAGE, SET_CURRENT_OBJECT, 
    SET_OBJECT_ON_LOAD_FETCH_STATE, SET_OBJECT_ON_SAVE_FETCH_STATE, SET_SHOW_DELETE_DIALOG_OBJECT
    } from "../actions/object";


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

                link: ""
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
                
                link: ""
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

                link: action.object.link !== undefined ? action.object.link : oldObject.link
            }
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

function setShowDeleteDialogObject(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            showDeleteDialog: action.showDeleteDialog
        }
    }
}


const root = {
    LOAD_ADD_OBJECT_PAGE: loadAddObjectPage,
    LOAD_EDIT_OBJECT_PAGE: loadEditObjectPage,
    SET_CURRENT_OBJECT: setCurrentObject,
    SET_OBJECT_ON_LOAD_FETCH_STATE: setObjectOnLoadFetchState,
    SET_OBJECT_ON_SAVE_FETCH_STATE: setObjectOnSaveFetchState,
    SET_SHOW_DELETE_DIALOG_OBJECT: setShowDeleteDialogObject
};

export default root;