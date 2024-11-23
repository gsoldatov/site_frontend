import { deepEqual } from "../../../../util/equality-checks";
import { ObjectsSelectors } from "./objects";

import type { State } from "../../../types/state";
import type { Markdown } from "../../../types/data/markdown";


export class EditedObjectsSelectors {
    /**
     * Returns a list of composite subobject IDs stored in `state.editedObjects` for the parent `objectIDs`.
     */
    static subobjectIDs(state: State, objectIDs: number[]): number[] {
        let result: number[] = [];
        for (let objectID of objectIDs) {
            if (objectID in state.editedObjects) {
                result = result.concat(
                    Object.keys(state.editedObjects[objectID].composite.subobjects).map(id => parseInt(id))
                );
            }
        }
        return result;
    }

    /**
     * Returns a list of new composite subobject IDs stored in `state.editedObjects` for the parent `objectIDs`.
     */
    static newSubobjectIDs(state: State, objectIDs: number[]): number[] {
        return EditedObjectsSelectors.subobjectIDs(state, objectIDs).filter(id => id < 0);
    }

    // TODO
    // - new object is modified check
    // - existing object is modified check
    // ? other checks, which replace `objectHasNoChanges` (with default values for new objects or missing data)

    /** 
     * Returns a boolean indicating if edited object's attributes of `objectID` are modified.
     * Throws if object data is not present in state.objectsTags.
     */
    static attributesAreModified(state: State, objectID: number): boolean {
        const objectAttributes = state.objects[objectID] as Record<string, any>;
        const editedObject = state.editedObjects[objectID] as Record<string, any>;
        if (objectAttributes === undefined) throw new ObjectMissingInStoreError(`Attributes for object '${objectID}' are missing.`);
        // Function should not be called if object is not edited
        if (editedObject === undefined) throw Error(`Attempted to check tags modification for object '${objectID}', which is not being edited.`);

        for (let key of Object.keys(objectAttributes)) 
            if (!deepEqual(objectAttributes[key], editedObject[key])) return true;
        return false;
    }

    /** 
     * Returns a boolean indicating if edited object's tags of `objectID` are modified.
     * Throws if object data is not present in state.objectsTags.
     */
    static tagsAreModified(state: State, objectID: number): boolean {
        const objectTags = state.objectsTags[objectID];
        const editedObject = state.editedObjects[objectID];
        if (objectTags === undefined) throw new ObjectMissingInStoreError(`Tags for object '${objectID}' are missing.`);
        // Function should not be called if object is not edited
        if (editedObject === undefined) throw Error(`Attempted to check tags modification for object '${objectID}', which is not being edited.`);

        return editedObject.addedTags.length > 0 || editedObject.removedTagIDs.length > 0 || !deepEqual(editedObject.currentTagIDs, objectTags);
    }

    /** 
     * Returns a boolean indicating if edited object's data of `objectID` is modified.
     * Throws if object data is not present in a corresponding data store.
     */
    static dataIsModified(state: State, objectID: number): boolean {
        const objectData = ObjectsSelectors.data(state, objectID);
        const editedObject = state.editedObjects[objectID];
        if (objectData === undefined) throw new ObjectMissingInStoreError(`Data for object '${objectID}' is missing.`);
        // Function should not be called if object is not edited
        if (editedObject === undefined) throw Error(`Attempted to check data modification for object '${objectID}', which is not being edited.`);

        switch(editedObject.object_type) {
            case "link":
                return !deepEqual(objectData, editedObject.link);
            case "markdown":
                return (objectData as Markdown).raw_text !== editedObject.markdown.raw_text;
            case "to_do_list":
                return !deepEqual(objectData, editedObject.toDoList);
            case "composite":
                return !deepEqual(objectData, editedObject.composite);
            default:
                throw Error(`Incorrect object type '${editedObject.object_type}' for object ID ${objectID}`);
        }
    }
}


/** Thrown when trying to compare an edited object to attributes, tags or data, which are missing in the corresponding store. */
class ObjectMissingInStoreError extends Error {};
