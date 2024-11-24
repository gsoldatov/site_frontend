import { EditedObjectsSelectors } from "../../selectors/data/objects/edited-objects";
import { ObjectsSelectors } from "../../selectors/data/objects/objects";

import { editedObject, getEditedObjectState, type EditedObject, type EditedObjects } from "../../types/data/edited-objects";
import type { State } from "../../types/state";


/** Contains state updating methods for state.editedObjects. */
export class EditedObjectsUpdaters {
    /** Adds `editedObjects` to state.editedObjects store. */
    static addEditedObjects(state: State, editedObjects: EditedObject[]): State {
        const newEditedObjects: EditedObjects = {};
        editedObjects.forEach(eo => {
            const validatedEO = editedObject.parse(eo);
            newEditedObjects[validatedEO.object_id] = validatedEO;
        });
        return { ...state, editedObjects: { ...state.editedObjects, ...newEditedObjects }};
    }

    /** 
     * Loads new or existing objects with `objectIDs` into state.editedObjects.
     * 
     * Existing objects are loaded from store, new objects are set to default values with optional overrides passed via `customValues`.
     * 
     * Deletes any present new composite subobjects of `objectIDs` from state.editedObjects.
     */
    static loadEditedObjects(state: State, objectIDs: number[], customValues: Partial<EditedObject> = {}): State {
        // Delete new composite subobjects
        const newSubobjectIDs = EditedObjectsSelectors.newSubobjectIDs(state, objectIDs);
        let newState = EditedObjectsUpdaters.removeEditedObjects(state, newSubobjectIDs);

        // Load new objects
        const newObjectIDs = objectIDs.filter(id => id <= 0);
        newState = loadNewEditedObjects(state, newObjectIDs, customValues);

        // Load existing objects & return result
        const existingObjectIDs = objectIDs.filter(id => id > 0);
        newState = loadExistingEditedObjects(newState, existingObjectIDs);
        return newState;
    }

    /**
     * Deletes `objectIDs` and their new composite subobjects from state.editedObjects.
     * If `removeAllSubobjects`, also removes their existing subobjects.
     */
    static removeEditedObjects(state: State, objectIDs: number[], removeAllSubobjects = false): State {
        const removedObjectIDs = removeAllSubobjects
            ? EditedObjectsSelectors.objectAndSubobjectIDs(state, objectIDs)
            : objectIDs.concat(EditedObjectsSelectors.newSubobjectIDs(state, objectIDs));
        
        const editedObjects = { ...state.editedObjects };
        for (let objectID of removedObjectIDs) delete editedObjects[objectID];
        return { ...state, editedObjects };
    }
}


/**
 * Loads new edited objects `objectIDs` into state with default or `customValues`.
 */
const loadNewEditedObjects = (state: State, objectIDs: number[], customValues: Partial<EditedObject>): State => {
    const editedObjects = { ...state.editedObjects };

    objectIDs.forEach(object_id => {
        if (!(object_id <= 0)) throw Error(`objectID '${object_id}' must be <= 0.`);
        editedObjects[object_id] = getEditedObjectState({ ...customValues, object_id });
    });

    return { ...state, editedObjects };
};


/** 
 * Loads edited objects `objectIDs` from store into state.editedObjects.
 * Throws, if attributes, tags or data are missing for any object.
 */
const loadExistingEditedObjects = (state: State, objectIDs: number[]): State => {
    const editedObjects = { ...state.editedObjects };

    objectIDs.forEach(objectID => {
        const attributes = state.objects[objectID], currentTagIDs = state.objectsTags[objectID], data = ObjectsSelectors.editedObjectData(state, objectID);
        if (attributes === undefined) throw Error(`Failed to load edited object '${objectID}': attributes are missing.`);
        if (currentTagIDs === undefined) throw Error(`Failed to load edited object '${objectID}': tags are missing.`);
        if (data === undefined) throw Error(`Failed to load edited object '${objectID}': data is missing.`);
        editedObjects[objectID] = getEditedObjectState({ ...attributes, currentTagIDs, ...data });
    });

    return { ...state, editedObjects };
};
