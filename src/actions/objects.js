import config from "../config";
import { isFetchingObjects } from "../store/state-check-functions";
import { getNonCachedTags } from "./tags";


const backendURL = config.backendURL;


export const ADD_OBJECTS = "ADD_OBJECTS";
export const ADD_OBJECT_DATA = "ADD_OBJECT_DATA";
export const SET_OBJECTS_TAGS = "SET_OBJECTS_TAGS";
export const SET_OBJECTS_TAGS_INPUT = "SET_OBJECTS_TAGS_INPUT";
export const SET_CURRENT_OBJECTS_TAGS = "SET_CURRENT_OBJECTS_TAGS";
export const DELETE_OBJECTS = "DELETE_OBJECTS";
export const SELECT_OBJECTS = "SELECT_OBJECTS";
export const TOGGLE_OBJECT_SELECTION = "TOGGLE_OBJECT_SELECTION";
export const DESELECT_OBJECTS = "DESELECT_OBJECTS";
export const CLEAR_SELECTED_OBJECTS = "CLEAR_SELECTED_OBJECTS";
export const SET_OBJECTS_PAGINATION_INFO = "SET_OBJECTS_PAGINATION_INFO";
export const SET_TAGS_FILTER = "SET_TAGS_FILTER";
export const SET_TAGS_FILTER_INPUT = "SET_TAGS_FILTER_INPUT";
export const SET_SHOW_DELETE_DIALOG_OBJECTS = "SET_SHOW_DELETE_DIALOG_OBJECTS";
export const SET_OBJECTS_FETCH = "SET_OBJECTS_FETCH";


export const addObjects                  = objects => ({ type: ADD_OBJECTS, objects });
export const addObjectData               = objectData => ({ type: ADD_OBJECT_DATA, objectData });
export const setObjectsTags              = objectsTags => ({ type: SET_OBJECTS_TAGS, objectsTags });
export const setObjectsTagsInput         = tagsInput => ({ type: SET_OBJECTS_TAGS_INPUT, tagsInput });
export const setCurrentObjectsTags       = tagUpdates => ({ type: SET_CURRENT_OBJECTS_TAGS, tagUpdates });
export const deleteObjects               = object_ids => ({ type: DELETE_OBJECTS, object_ids });
export const selectObjects               = object_ids => ({ type: SELECT_OBJECTS, object_ids });
export const toggleObjectSelection       = object_id => ({ type: TOGGLE_OBJECT_SELECTION, object_id });
export const deselectObjects             = object_ids => ({ type: DESELECT_OBJECTS, object_ids });
export const clearSelectedObjects        = () => ({ type: CLEAR_SELECTED_OBJECTS });
export const setObjectsPaginationInfo    = paginationInfo => ({ type: SET_OBJECTS_PAGINATION_INFO, paginationInfo });
export const setTagsFilter               = tagID => ({ type: SET_TAGS_FILTER, tagID });
export const setTagsFilterInput          = tagsFilterInput => ({ type: SET_TAGS_FILTER_INPUT, tagsFilterInput });
export const setShowDeleteDialogObjects  = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECTS, showDeleteDialog });
export const setObjectsFetch             = (isFetching = false, fetchError = "") => ({ type: SET_OBJECTS_FETCH, isFetching: isFetching, fetchError: fetchError });


function getObjectsFetch(object_ids) {
    return async (dispatch, getState) => {
        let payload = JSON.stringify({ object_ids: object_ids });
        let response = await fetch(`${backendURL}/objects/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        switch (response.status) {
            case 200:
                let objects = (await response.json())["objects"];
                dispatch(addObjects(objects));
                dispatch(setObjectsTags(objects));

                let allObjectsTags = new Set();
                objects.forEach(object => object.current_tag_ids.forEach(tagID => allObjectsTags.add(tagID)));
                await dispatch(getNonCachedTags([...allObjectsTags]));
                return;
            case 400:
            case 404:
                throw new Error((await response.json())["_error"]);
                return;
            case 500:
                throw new Error(await response.text());
                return;
        }
    };
};

function getPageObjectIDs() {
    return async (dispatch, getState) => {
        let pI = getState().objectsUI.paginationInfo;
        let response = await fetch(`${backendURL}/objects/get_page_object_ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pagination_info: {
                    page: pI.currentPage,
                    items_per_page: pI.itemsPerPage,
                    order_by: pI.sortField,
                    sort_order: pI.sortOrder,
                    filter_text: pI.filterText,
                    object_types: pI.objectTypes,
                    tags_filter: pI.tagsFilter
                }
            })
        });

        switch (response.status) {
            case 200:
                let json = await response.json();
                dispatch(setObjectsPaginationInfo({ totalItems: json["total_items"], currentPageObjectIDs: json["object_ids"] }));
                return;
            case 400:
            case 404:
                throw new Error((await response.json())["_error"]);
            case 500:
                throw new Error(await response.text());
        }
    };
}

export function pageFetch(currentPage) {
    return async (dispatch, getState) => {
        const state = getState();

        if (isFetchingObjects(state)) return;

        try {
            dispatch(setObjectsPaginationInfo({ currentPage: currentPage }));
            dispatch(setObjectsFetch(true, ""));
            await dispatch(getPageObjectIDs());
            let nonCachedObjects = getState().objectsUI.paginationInfo.currentPageObjectIDs.filter(object_id => !(object_id in state.objects));
            if (nonCachedObjects.length !== 0) {   // Fetch objects of the current page which were not cached before
                await dispatch(getObjectsFetch(nonCachedObjects));
            }
            dispatch(setObjectsFetch(false, ""));
        }
        catch(error) {
            dispatch(setObjectsFetch(false, error.message));
        }
    };
};

export function setObjectsPaginationInfoAndFetchPage(paginationInfo){
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setObjectsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
};

export function setTagsFilterAndFetchPage(tagID){
    return async (dispatch, getState) => {
        dispatch(setObjectsPaginationInfo({ currentPage: 1 }));
        dispatch(setTagsFilter(tagID));
        dispatch(pageFetch(1));
    };
};

export function objectsOnLoadFetch() {
    return async (dispatch, getState) => {
        const currentPage = getState().objectsUI.paginationInfo.currentPage;
        dispatch(setObjectsTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));
        dispatch(setCurrentObjectsTags({ added: [], removed: [] }));
        dispatch(pageFetch(currentPage));
    };
};

export function onDeleteFetch() {
    return async (dispatch, getState) => {
        // Hide delete dialog
        dispatch(setShowDeleteDialogObjects(false));

        // Exit if already fetching
        let state = getState();

        if (isFetchingObjects(state)) return;
        
        try {
            // Update fetch status
            dispatch(setObjectsFetch(true, ""));

            // Fetch object data and handle response
            let payload = JSON.stringify({ 
                object_ids: state.objectsUI.selectedObjectIDs
            });

            let response = await fetch(`${backendURL}/objects/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            let deleteFromState = true;
            let error = "";

            switch (response.status) {
                case 200:
                    break;
                case 400:
                    error = (await response.json())._error;
                    deleteFromState = false;
                    break;
                case 404:
                    // error = "Objects not found.";
                    break;
                case 500:
                    error = await response.text();
                    deleteFromState = false;
                    break;
            }

            if (deleteFromState) {
                dispatch(setObjectsPaginationInfo({ currentPageObjectIDs: state.objectsUI.paginationInfo.currentPageObjectIDs.filter(id => !state.objectsUI.selectedObjectIDs.includes(id)) }));  // delete from current page
                dispatch(deleteObjects(state.objectsUI.selectedObjectIDs));  // delete from object storage
                dispatch(clearSelectedObjects());    // clear object selection
            }
            dispatch(setObjectsFetch(false, error));
        } catch (error) {
            dispatch(setObjectsFetch(false, error.message));
        }
    };
};

/*
    Creates a thunk creator, which queries /tags/search to retrieve matchingIDs and updates state with the provided actionCreator.
*/
const dropdownFetchThunkCreatorCreator = (actionCreator, inputTextSelector) => {
    return function objectsTagsDropdownFetch({queryText, existingIDs}) {
        return async (dispatch, getState) => {
            // Check params
            const inputText = inputTextSelector(getState());
            if (inputText.length === 0) {   // exit fetch if an item was added before the start of the fetch
                dispatch(actionCreator({ matchingIDs: [] }));
                return;
            }
            
            if (queryText.length === 0 || queryText.length > 255 || existingIDs.length > 1000) return;

            try {
                let payload = JSON.stringify({
                    query: {
                        query_text: queryText,
                        maximum_values: 10,
                        existing_ids: existingIDs || []
                    }
                });

                let response = await fetch(`${backendURL}/tags/search`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload
                });
                            
                switch (response.status) {
                    case 200:
                        let tagIDs = (await response.json()).tag_ids;
                        await dispatch(getNonCachedTags(tagIDs));

                        // Do not update if input text changed during fetch
                        if (inputText === inputTextSelector(getState())) dispatch(actionCreator({ matchingIDs: tagIDs }));
                        break;
                    case 404:
                        dispatch(actionCreator({ matchingIDs: [] }));
                        break;
                    case 400:
                        throw Error((await response.json())._error);
                    case 500:
                        throw Error(await response.text());
                }
            } catch (error) {
                throw error;
            }
        };
    };
};

export const objectsTagsDropdownFetch = dropdownFetchThunkCreatorCreator(setObjectsTagsInput, state => state.objectsUI.tagsInput.inputText);
export const tagsFilterDropdownFetch = dropdownFetchThunkCreatorCreator(setTagsFilterInput, state => state.objectsUI.tagsFilterInput.inputText);

// export function objectsTagsDropdownFetch({queryText, existingIDs}) {
//     return async (dispatch, getState) => {
//         // Check params
//         if (queryText.length === 0 || queryText.length > 255 || existingIDs.length > 1000) return;
//         const inputText = getState().objectsUI.tagsInput.inputText;

//         try {
//             let payload = JSON.stringify({
//                 query: {
//                     query_text: queryText,
//                     maximum_values: 10,
//                     existing_ids: existingIDs || []
//                 }
//             });

//             let response = await fetch(`${backendURL}/tags/search`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: payload
//             });
                        
//             switch (response.status) {
//                 case 200:
//                     let tagIDs = (await response.json()).tag_ids;
//                     await dispatch(getNonCachedTags(tagIDs));

//                     // Do not update if input text changed during fetch
//                     if (inputText === getState().objectsUI.tagsInput.inputText) dispatch(setObjectsTagsInput({ matchingIDs: tagIDs }));
//                     break;
//                 case 404:
//                     dispatch(setObjectsTagsInput({ matchingIDs: [] }));
//                     break;
//                 case 400:
//                     throw Error((await response.json())._error);
//                 case 500:
//                     throw Error(await response.text());
//             }
//         } catch (error) {
//             throw error;
//         }
//     };
// };

export function onObjectsTagsUpdateFetch() {
    return async (dispatch, getState) => {
        let state = getState();
        if (isFetchingObjects(state)) return;

        try {
            // Reset tag input & update fetch status
            dispatch(setObjectsTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));
            dispatch(setObjectsFetch(true, ""));

            let payload = JSON.stringify({
                object_ids: state.objectsUI.selectedObjectIDs,
                added_tags: state.objectsUI.addedTags,
                removed_tag_ids: state.objectsUI.removedTagIDs
            });

            let response = await fetch(`${backendURL}/objects/update_tags`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: payload
            });
                        
            switch (response.status) {
                case 200:
                    let json = (await response.json());

                    // Update objects tags & query missing tags
                    let objects = state.objectsUI.selectedObjectIDs.map(objectID => ({ object_id: objectID, tag_updates: json.tag_updates }));
                    dispatch(setObjectsTags(objects));
                    await dispatch(getNonCachedTags(json.tag_updates.added_tag_ids));

                    // Reset added & removed tags
                    dispatch(setCurrentObjectsTags({ added: [], removed: [] }));

                    // Update modified_at attributes of the objects
                    let modifiedAt = json.modified_at;
                    objects = [];
                    state.objectsUI.selectedObjectIDs.forEach(objectID => {
                        let object = {...state.objects[objectID]};
                        object.modified_at = modifiedAt;
                        objects.push(object);
                    });
                    dispatch(addObjects(objects));

                    // End fetch
                    dispatch(setObjectsFetch(false, ""));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setObjectsFetch(false, error.message));
        }
    };
};