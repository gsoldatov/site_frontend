import { getConfig } from "../config";

import { getResponseErrorType } from "./common";
import { objectsUpdateFetch } from "./data/objects";
import { objectsViewFetch, objectsViewCompositeHierarchyElements } from "./data/objects";
import { fetchMissingTags } from "./data/tags";

import { ObjectsViewSelectors } from "../store/selectors/ui/objects-view";
import { ObjectsSelectors } from "../store/selectors/data/objects/objects";
import { CompositeSelectors } from "../store/selectors/data/objects/composite";
import { getToDoListUpdateFetchBody } from "../store/state-util/to-do-lists";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


const backendURL = getConfig().backendURL;


/**
 * Runs to-do list object update fetch, which saves changes made to to-do list data on the /objects/view/:id page
 */
export const objectsViewToDoListObjectUpdateFetch = (objectID, toDoList) => {
    return async (dispatch, getState) => {
        const obj = getToDoListUpdateFetchBody(getState(), objectID, toDoList);
        return await dispatch(objectsUpdateFetch(obj));
    };
};


/**
 * Updates suboobject's `is_expanded` state on expand/collapse toggle
 * 
 * NOTE: should use patched update, because paraller fetch calls can lead to data inconsistency.
 */
export const objectsViewMulticolumnExpandToggleUpdateFetch = (objectID, subobjectID, is_expanded) => {
    return async (dispatch, getState) => {
        // Check if current user can update the object
        const state = getState();
        if (!ObjectsViewSelectors.canEditObject(state, objectID)) return;

        const newProps = { composite: { subobjects: { [subobjectID]: { is_expanded }}}};

        const object = CompositeSelectors.serializeObjectForUpdate(state, objectID, newProps);
        
        return await dispatch(objectsUpdateFetch(object));
    };
};
