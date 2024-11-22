import type { State } from "../../store/types/state";
import type { Dispatch, GetState } from "../../util/types/common";
import { getEditedObjectState } from "../../store/types/data/edited-objects";
import { getObjectsEditUI } from "../../store/types/ui/objects-edit";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Loads default ui state of the /objects/edit/:id page for a new object. */
export const loadObjectsEditNewPage = () => ({ type: "LOAD_OBJECTS_EDIT_NEW_PAGE" });

const _loadObjectsEditNewPage = (state: State, action: any): State => {
    // Add a new edited object if it's missing
    const editedObjects = "0" in state.editedObjects 
        ? state.editedObjects
        : { ...state.editedObjects, [0]: getEditedObjectState({ object_id: 0, display_in_feed: true, owner_id: state.auth.user_id })};
    
    return { ...state, editedObjects, objectsEditUI: getObjectsEditUI({ currentObjectID: 0 }) };
}


export const objectsEditRoot = {
    "LOAD_OBJECTS_EDIT_NEW_PAGE": _loadObjectsEditNewPage
};
