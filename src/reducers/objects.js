import { ADD_OBJECTS, ADD_OBJECT_DATA, deleteObjectData, DELETE_OBJECTS, /*SELECT_OBJECTS, TOGGLE_OBJECT_SELECTION,*/ DESELECT_OBJECTS, 
    /*CLEAR_SELECTED_OBJECTS, SET_OBJECTS_PAGINATION_INFO, SET_OBJECTS_REDIRECT_ON_RENDER,
SET_SHOW_DELETE_DIALOG_OBJECTS, SET_OBJECTS_PAGINATION_FETCH, SET_OBJECTS_ON_DELETE_FETCH*/ } from "../actions/objects";

function addObjects(state, action) {
    let newObjects = {};
    action.objects.forEach(object => newObjects[object.object_id] = object);
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

function deleteObjects(state, action) {
    let objects = {...state.objects};
    let links = {...state.links};
    for (let objectID of action.object_ids) {
        delete objects[objectID];
        delete links[objectID];
    }

    return {
        ...state,
        objects: objects,
        links: links
    };
}


// function selectObjects(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             selectedobjectIDs: [...(new Set(state.objectsUI.selectedobjectIDs.concat(action.object_ids)))]
//         }
//     }
// }

// function toggleObjectSelection(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             selectedobjectIDs: state.objectsUI.selectedobjectIDs.includes(action.object_id) 
//                             ? state.objectsUI.selectedobjectIDs.filter(object_id => object_id !== action.object_id)
//                             : state.objectsUI.selectedobjectIDs.concat(action.object_id)
//         }
//     };
// }

function deselectObjects(state, action) {
    return {
        ...state,
        objectsUI: {
            ...state.objectsUI,
            selectedobjectIDs: state.objectsUI.selectedobjectIDs.filter(object_id => !action.object_ids.includes(object_id))
        }
    };
}

// function clearSelectedObjects(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             selectedobjectIDs: []
//         }
//     };
// }

// function setObjectsPaginationInfo(state, action) {
//     let oPI = state.objectsUI.paginationInfo;
//     let pI = action.paginationInfo;
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             paginationInfo: {
//                     currentPage: pI.currentPage !== undefined ? pI.currentPage : oPI.currentPage,
//                     itemsPerPage: pI.itemsPerPage !== undefined ? pI.itemsPerPage : oPI.itemsPerPage,
//                     totalItems: pI.totalItems !== undefined ? pI.totalItems : oPI.totalItems,
//                     sortField: pI.sortField !== undefined ? pI.sortField : oPI.sortField,
//                     sortOrder: pI.sortOrder !== undefined ? pI.sortOrder : oPI.sortOrder,
//                     filterText: pI.filterText !== undefined ? pI.filterText : oPI.filterText,
//                     currentPageobjectIDs: pI.currentPageobjectIDs !== undefined ? pI.currentPageobjectIDs : oPI.currentPageobjectIDs
//             }
//         }
//     }
// }

// function setObjectsRedirectOnRender(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             redirectOnRender: action.redirectOnRender
//         }
//     }
// }

// function setShowDeleteDialogObjects(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             showDeleteDialog: action.showDeleteDialog
//         }
//     }
// }

// function setObjectsPaginationFetch(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             lastFetch: action.lastFetch === undefined ? state.objectsUI.lastFetch : action.lastFetch,
//             paginationFetch: {
//                 isFetching: action.isFetching,
//                 fetchError: action.fetchError
//             }
//         }
//     }
// }


// function setObjectsOnDeleteFetch(state, action) {
//     return {
//         ...state,
//         objectsUI: {
//             ...state.objectsUI,
//             lastFetch: action.lastFetch === undefined ? state.objectsUI.lastFetch : action.lastFetch,
//             onDeleteFetch: {
//                 isFetching: action.isFetching,
//                 fetchError: action.fetchError
//             }
//         }
//     }
// }

const root = {
    ADD_OBJECTS: addObjects,
    ADD_OBJECT_DATA: addObjectData,
    DELETE_OBJECTS: deleteObjects,
//     SELECT_OBJECTS: selectObjects,
//     TOGGLE_OBJECT_SELECTION: toggleObjectSelection,
//     DESELECT_OBJECTS: deselectObjects,
//     CLEAR_SELECTED_OBJECTS: clearSelectedObjects,
//     SET_OBJECTS_PAGINATION_INFO: setObjectsPaginationInfo,
//     SET_OBJECTS_REDIRECT_ON_RENDER: setObjectsRedirectOnRender,
//     SET_SHOW_DELETE_DIALOG_OBJECTS: setShowDeleteDialogObjects,
//     SET_OBJECTS_PAGINATION_FETCH: setObjectsPaginationFetch,
//     SET_OBJECTS_ON_DELETE_FETCH: setObjectsOnDeleteFetch
};

export default root;