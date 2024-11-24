import { deepEqual } from "../../../../util/equality-checks";
import { ObjectsSelectors } from "./objects";

import type { State } from "../../../types/state";
import { getEditedObjectState } from "../../../types/data/edited-objects";
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

    /** Returns an array with `objectIDs` and IDs of all their subobjects found in state.editedObjects. */
    static objectAndSubobjectIDs(state: State, objectIDs: (number | string)[]) {
        const numericObjectIDs = objectIDs.map(id => parseInt(id as string));
        const result = numericObjectIDs.slice();
        
        numericObjectIDs.forEach(objectID => {
            const editedObject = state.editedObjects[objectID];
            if (editedObject !== undefined && editedObject.object_type === "composite")
                Object.keys(editedObject.composite.subobjects).forEach(subobjectID => result.push(parseInt(subobjectID)));
        });

        // Deduplicate before return
        return [...new Set(result)];
    };

    /** 
     * Returns true, if an existing edited object `objectID` is modified, or false, otherwise.
     * Throws if any object part is not present in state storages.
     */
    static isModifiedExisting(state: State, objectID: number): boolean {
        return EditedObjectsSelectors.attributesAreModified(state, objectID)
            || EditedObjectsSelectors.tagsAreModified(state, objectID)
            || EditedObjectsSelectors.dataIsModified(state, objectID)
        ;
    }

    /** 
     * Returns true, if `objectID` belongs to a new or unchanged existing edited object, or false otherwise.
     * Throws, if `objectID` is not present in any of the data stores.
     */
    static isNewOrUnchangedExisting(state: State, objectID: number | string): boolean {
        if (typeof objectID === "string") objectID = parseInt(objectID);
        return objectID <= 0 || !EditedObjectsSelectors.isModifiedExisting(state, objectID);
    }

    /**
     * Returns true if a new edited object `objectID` is modified, or false, otherwise.
     * Throws, if `objectID` is existing or not being edited.
     */
    static isModifiedNew(state: State, objectID: number): boolean {
        if (objectID > 0) throw Error(`Can't use the function for an existing object '${objectID}'.`);
        const editedObject = state.editedObjects[objectID];
        if (editedObject === undefined)
            throw new ObjectMissingInStoreError(`Edited object '${objectID}' is missing.`);

        return !deepEqual(state.editedObjects[objectID], getEditedObjectState({ object_id: objectID, display_in_feed: true, owner_id: state.auth.user_id }));
    }

    /**
     * Returns true, if a new or existing object `objectID` is modified, or false, otherwise.
     * If modification status (both new & existing) could not be resolved, returns `defaultValue`.
     */
    static safeIsModified(state: State, objectID: number, defaultValue: boolean): boolean {
        try {
            if (objectID <= 0) return EditedObjectsSelectors.isModifiedNew(state, objectID);
            return EditedObjectsSelectors.isModifiedExisting(state, objectID);
        } catch (e) {
            if (e instanceof ObjectMissingInStoreError) return defaultValue;
            else throw e;
        }
    }

    /** 
     * Returns a boolean indicating if edited object's attributes of `objectID` are modified.
     * Throws if object attributes are not present in state.objects.
     */
    static attributesAreModified(state: State, objectID: number): boolean {
        const objectAttributes = state.objects[objectID] as Record<string, any>;
        const editedObject = state.editedObjects[objectID] as Record<string, any>;
        if (editedObject === undefined || objectAttributes === undefined)
            throw new ObjectMissingInStoreError(`Edited object '${objectID}' or its attributes are missing.`);

        for (let key of Object.keys(objectAttributes)) 
            if (!deepEqual(objectAttributes[key], editedObject[key])) return true;
        return false;
    }

    /** 
     * Returns a boolean indicating if edited object's tags of `objectID` are modified.
     * Throws if object's tags are not present in state.objectsTags.
     */
    static tagsAreModified(state: State, objectID: number): boolean {
        const objectTags = state.objectsTags[objectID];
        const editedObject = state.editedObjects[objectID];
        if (editedObject === undefined || objectTags === undefined)
            throw new ObjectMissingInStoreError(`Edited object '${objectID}' or its tags are missing.`);

        return editedObject.addedTags.length > 0 || editedObject.removedTagIDs.length > 0 || !deepEqual(editedObject.currentTagIDs, objectTags);
    }

    /** 
     * Returns a boolean indicating if edited object's data of `objectID` is modified.
     * Throws if object data is not present in a corresponding data store.
     */
    static dataIsModified(state: State, objectID: number): boolean {
        const objectData = ObjectsSelectors.data(state, objectID);
        const editedObject = state.editedObjects[objectID];
        if (editedObject === undefined || objectData === undefined)
            throw new ObjectMissingInStoreError(`Edited object '${objectID}' or its data are missing.`);

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
