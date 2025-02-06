import { EditedObjectsSelectors } from "../../selectors/data/objects/edited-objects";
import { ObjectsSelectors } from "../../selectors/data/objects/objects";

import { editedObject, getEditedObjectState, type EditedObject, type EditedObjects } from "../../../types/store/data/edited-objects";
import type { State } from "../../../types/store/state";
import type { Link } from "../../../types/store/data/links";
import type { Markdown } from "../../../types/store/data/markdown";
import type { ToDoList } from "../../../types/store/data/to-do-list";
import type { Composite } from "../../../types/store/data/composite";


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
        newState = loadNewEditedObjects(newState, newObjectIDs, customValues);

        // Load existing objects & return result
        const existingObjectIDs = objectIDs.filter(id => id > 0);
        newState = loadExistingEditedObjects(newState, existingObjectIDs);
        return newState;
    }

    /**
     * Performs partial updates on edited objects provided in `updatesList`.
     * 
     * Each `update` can contain partial top-level attributes of an edited object or partial top-level of data attributes.
     * 
     * Ignores updates for `objectID`, which is not present in state.editedObjects.
     */
    static updateEditedObjects(state: State, updatesList: { objectID: number, update: EditedObjectUpdate }[]): State {
        const editedObjects: EditedObjects = {};

        for (let { objectID, update } of updatesList) {
            // Ignore attempts to update non-existing object
            // (i.e. when saving new Markdown object & redirecting to its page before it's data was parsed after last update)
            const old = state.editedObjects[objectID];            
            if (old === undefined) continue;

            editedObjects[objectID] = editedObject.parse({
                ...old,
    
                // Top-level attributes
                ...update,
    
                // Shallow partial update of data attributes
                link: "link" in update ? { ...old.link, ...update.link } : old.link,
                markdown: "markdown" in update ? { ...old.markdown, ...update.markdown } : old.markdown,
                toDoList: "toDoList" in update ? { ...old.toDoList, ...update.toDoList } : old.toDoList,
                composite: "composite" in update ? { ...old.composite, ...update.composite } : old.composite
            });
        }

        return { ...state, editedObjects: { ...state.editedObjects, ...editedObjects }};
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
 * 
 * Adds current user as objects' owner.
 */
const loadNewEditedObjects = (state: State, objectIDs: number[], customValues: Partial<EditedObject>): State => {
    const editedObjects = { ...state.editedObjects };

    objectIDs.forEach(object_id => {
        if (!(object_id <= 0)) throw Error(`objectID '${object_id}' must be <= 0.`);
        editedObjects[object_id] = getEditedObjectState({ ...customValues, object_id, owner_id: state.auth.user_id });
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


export type EditedObjectUpdate = Partial<Omit<EditedObject, "link" | "markdown" | "toDoList" | "composite">>
    & Partial<{ link: Partial<Link> }> & Partial<{ markdown: Partial<Markdown> }>
    & Partial<{ toDoList: Partial<ToDoList> }> & Partial<{ composite: Partial<Composite> }>
;