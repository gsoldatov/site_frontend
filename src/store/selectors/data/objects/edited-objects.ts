import { z } from "zod";
import { deepEqual } from "../../../../util/equality-checks";
import { ObjectsSelectors } from "./objects";

import { getEditedObjectState } from "../../../../types/store/data/edited-objects";
import { compositeSubobject, SubobjectDeleteMode } from "../../../../types/store/data/composite";

import type { State } from "../../../../types/store/state";
import type { Markdown } from "../../../../types/store/data/markdown";


/** Specifies, how an edited object is checked for modification (which attributes are ignored). */
type IsModifiedMode = "persist" | "save";


export class EditedObjectsSelectors {
    /**
     *  Returns an available `object_id` value for a new subobject.
     */
    static getNewSubobjectID(state: State) {
        let minObjectID = 0;
        for (let objectID of Object.keys(state.editedObjects).map(id => parseInt(id))) {
            if (isNaN(objectID)) throw TypeError(`Received a non-numerical object ID when calculating an ID of new subobject: "${objectID}"`);
            minObjectID = Math.min(minObjectID, objectID);
        }
        return minObjectID - 1;
    };

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
        return [...new Set(result)];
    }

    /**
     * Returns a list of new composite subobject IDs stored in `state.editedObjects` for the parent `objectIDs`.
     */
    static newSubobjectIDs(state: State, objectIDs: number[]): number[] {
        return EditedObjectsSelectors.subobjectIDs(state, objectIDs).filter(id => id < 0);
    }

    /** 
     * Returns a list with `objectIDs` and IDs of all their subobjects found in state.editedObjects. 
     * 
     * `checkNonComposite` can be set to true to get all subobjects, regardless of object type of `objectID`.
     */
    static objectAndSubobjectIDs(state: State, objectIDs: (number | string)[], checkNonComposite?: boolean) {
        const numericObjectIDs = objectIDs.map(id => parseInt(id as string));
        const result = numericObjectIDs.slice();
        
        numericObjectIDs.forEach(objectID => {
            const editedObject = state.editedObjects[objectID];
            if (editedObject !== undefined && 
                (checkNonComposite || editedObject.object_type === "composite"))
                Object.keys(editedObject.composite.subobjects).forEach(subobjectID => result.push(parseInt(subobjectID)));
        });

        // Deduplicate before return
        return [...new Set(result)];
    }

    /** 
     * Returns a list with `objectIDs` and IDs of their existing subobjects found in state.editedObjects. 
     * 
     * `checkNonComposite` can be set to true to get all subobjects, regardless of object type of `objectID`.
     */
    static objectAndExistingSubobjectIDs(state: State, objectIDs: (number | string)[], checkNonComposite?: boolean) {
        return EditedObjectsSelectors.objectAndSubobjectIDs(state, objectIDs, checkNonComposite).filter(id => id > 0 || objectIDs.includes(id));
    }

    /**
     * Returns a list object IDs present in state.editedObjects, which are part of a composite hierarchy starting from `rootObjectID`.
     * 
     * Objects, which aren't edited, including `rootObjectID`, are not returned.
     * 
     * If `checkNonComposite` is true, any subobjects from non-composite objects will be included 
     */
    static editedCompositeHierarchyObjectIDs(state: State, rootObjectID: number, checkNonComposite: boolean) {
        const result: Set<number> = new Set();
        const queue: number[] = [rootObjectID];

        // Scan hierarchy members
        while (queue.length > 0) {
            const currentObjectID = queue.shift() as number;
            if (!result.has(currentObjectID)) {
                const editedObject = state.editedObjects[currentObjectID];
                if (editedObject !== undefined) {
                    // Add current object ID to result
                    result.add(currentObjectID);

                    // Add composite subobjects for further checks
                    // (check non-composite edited objects as well, if specified to
                    // (for the case of clearing new subobjects of non-composite objects))
                    if (checkNonComposite || editedObject.object_type === "composite")
                        Object.keys(editedObject.composite.subobjects).map(id => parseInt(id)).forEach(id => queue.push(id));
                }
            }
        }

        return [...result];
    }

    /**
     * Returns IDs of edited objects, which are to be upserted, fully deleted
     * and removed from state after bulk upsert for the composite hierarchy starting from `rootObjectID`.
     * 
     * NOTE: objects, removed from state, must be additionally filtered from objects, which will be displayed on the
     * object edit page (i.e., current edited object & its subobjects) after a successful bulk upsert.
     */
    static getUpsertedDeletedAndRemovedObjectIDs(state: State, rootObjectID: number) {
        const upsertedObjectIDs: number[] = [];
        const deletedObjectIDs: number[] = [];
        const removedFromStateObjectIDs: number[] = [];

        // Root object (upserted & removed from state, if new)
        upsertedObjectIDs.push(rootObjectID);
        if (rootObjectID <= 0) removedFromStateObjectIDs.push(rootObjectID);

        // Recursively loop through subobjects, until all present in `state.editedObjects` are visited
        const queue: number[] = [rootObjectID];
        const visited: Set<number> = new Set();

        while (queue.length > 0) {
            // Check if object was not visited before, or not being edited
            const objectID = queue.shift() as number;
            if (visited.has(objectID)) continue;
            visited.add(objectID);
            
            const editedObject = state.editedObjects[objectID]
            if (editedObject === undefined) continue;

            // Subobjects of non-composite objects
            if (editedObject.object_type !== "composite") {
                for (let subobjectID of Object.keys(editedObject.composite.subobjects).map(id => parseInt(id))) {
                    // New & unmodified existing subobjects are removed from state
                    if (subobjectID <= 0
                        || !EditedObjectsSelectors.safeIsModified(state, subobjectID, "save", true)
                    ) removedFromStateObjectIDs.push(subobjectID);
                    
                    // Subobjects are not recursively looped through
                }
            } else {
                for (let subobjectID of Object.keys(editedObject.composite.subobjects).map(id => parseInt(id))) {
                    const { deleteMode } = editedObject.composite.subobjects[subobjectID];
                    
                    // Add subobject for recursive check
                    queue.push(subobjectID);

                    // Mark subobject to be removed from state
                    // (displayed subobjects are expected to be filtered out of this array outside this function)
                    removedFromStateObjectIDs.push(subobjectID);

                    // Non-deleted subobjects
                    if (deleteMode === SubobjectDeleteMode.none) {
                        // New & existing modified subobjects are upserted
                        if (subobjectID <= 0) {
                            upsertedObjectIDs.push(subobjectID);
                        }
                        else {
                            if (EditedObjectsSelectors.safeIsModified(state, subobjectID, "save", true)) {
                                upsertedObjectIDs.push(subobjectID);
                            }
                        }
                    } 
                    // Removed subobjects
                    else if (deleteMode === SubobjectDeleteMode.subobjectOnly) {
                        // Modified existing are upserted
                        if (subobjectID > 0 && EditedObjectsSelectors.safeIsModified(state, subobjectID, "save", true))
                            upsertedObjectIDs.push(subobjectID);
                    }
                    // Fully deleted subobjects
                    else {
                        // Existing subobjects are fully deleted
                        if (subobjectID > 0) deletedObjectIDs.push(subobjectID);
                    }
                }
            }
        }
            
        return {
            upsertedObjectIDs: [...new Set(upsertedObjectIDs)],
            deletedObjectIDs: [...new Set(deletedObjectIDs)],
            removedFromStateObjectIDs: [...new Set(removedFromStateObjectIDs)]
        }
    }

    /**
     * Returns a list of object IDs from `subobjectIDs`, which are composite subobjects with specified `deleteModes`
     * in any composite object from `objectIDs`.
     */
    static subobjectIDsWithDeleteModes(state: State, objectIDs: number[], subobjectIDs: number[], deleteModes: SubobjectDeleteMode[]): number[] {
        const subobjectsWithMatchingDeleteMode = subobjectIDs.reduce((result, objectID) => {
            const eo = state.editedObjects[objectID];
            if (eo.object_type === "composite")
                for (let subobjectID of Object.keys(eo.composite.subobjects).map(id => parseInt(id)))
                    if (deleteModes.includes(eo.composite.subobjects[subobjectID].deleteMode))
                        result.add(subobjectID);
            return result;
        }, new Set() as Set<number>);
        return subobjectIDs.filter(id => subobjectsWithMatchingDeleteMode.has(id));
    }

    /** 
     * Returns true, if an existing edited object `objectID` is modified, or false, otherwise.
     * Throws if any object part is not present in state storages.
     * 
     * `mode` specifies, which attributes are not checked for modification.
     */
    static isModifiedExisting(state: State, objectID: number, mode: IsModifiedMode): boolean {
        return attributesAreModified(state, objectID)
            || tagsAreModified(state, objectID)
            || dataIsModified(state, objectID, mode)
        ;
    }

    /** 
     * Returns true, if `objectID` belongs to a new or unchanged existing edited object, or false otherwise.
     * Throws, if `objectID` is not present in any of the data stores.
     * 
     * `mode` specifies, which attributes are not checked for modification.
     */
    static isNewOrUnchangedExisting(state: State, objectID: number | string, mode: IsModifiedMode): boolean {
        if (typeof objectID === "string") objectID = parseInt(objectID);
        return objectID <= 0 || !EditedObjectsSelectors.isModifiedExisting(state, objectID, mode);
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

        return !deepEqual(
            state.editedObjects[objectID],
            getEditedObjectState({ object_id: objectID, owner_id: state.auth.user_id }),
            ["markdown.parsed"]
        );
    }

    /**
     * Returns true, if a new or existing object `objectID` is modified, or false, otherwise.
     * If modification status (both new & existing) could not be resolved, returns `defaultValue`.
     * 
     * `mode` specifies, which attributes are not checked for modification.
     */
    static safeIsModified(state: State, objectID: number, mode: IsModifiedMode, defaultValue: boolean): boolean {
        try {
            if (objectID <= 0) return EditedObjectsSelectors.isModifiedNew(state, objectID);
            return EditedObjectsSelectors.isModifiedExisting(state, objectID, mode);
        } catch (e) {
            if (e instanceof ObjectMissingInStoreError) return defaultValue;
            throw e;
        }
    }

    /** 
     * Returns a boolean indicating if edited object's attributes of `objectID` are modified.
     * If modification status could not be resolved, returns `defaultValue`.
     */
    static safeAttributesAreModified(state: State, objectID: number, defaultValue: boolean): boolean {
        try {
            return attributesAreModified(state, objectID);
        } catch (e) {
            if (e instanceof ObjectMissingInStoreError) return defaultValue;
            throw e;
        }
    }

    /** 
     * Returns a boolean indicating if edited object's tags of `objectID` are modified.
     * If modification status could not be resolved, returns `defaultValue`.
     */
    static safeTagsAreModified(state: State, objectID: number, defaultValue: boolean): boolean {
        try {
            return tagsAreModified(state, objectID);
        } catch (e) {
            if (e instanceof ObjectMissingInStoreError) return defaultValue;
            throw e;
        }
    }

    /** 
     * Returns a boolean indicating if edited object's data of `objectID` is modified.
     * If modification status could not be resolved, returns `defaultValue`.
     * 
     * `mode` specifies, which attributes are not checked for modification.
     */
    static safeDataIsModified(state: State, objectID: number, mode: IsModifiedMode, defaultValue: boolean): boolean {
        try {
            return dataIsModified(state, objectID, mode);
        } catch (e) {
            if (e instanceof ObjectMissingInStoreError) return defaultValue;
            throw e;
        }
    }

    /**
     * Returns true, if subobject data of `subobjectID` in `objectID` is modified, or false otherwise.
     * 
     * If subobject is not found in store or edited object state, returns false.
     */
    static subobjectStateIsModified(state: State, objectID: number, subobjectID: number) {
        const storeState = state.composite[objectID]?.subobjects[subobjectID];
        const editedState = state.editedObjects[objectID]?.composite.subobjects[subobjectID];
        if (storeState === undefined || editedState === undefined) return false;
        const excludedAttributes = new Set(["deleteMode", "fetchError"]);
        const checkedAttributes = Object.keys(compositeSubobject.shape).filter(k => !excludedAttributes.has(k));

        for (let attr of checkedAttributes) {
            if (!deepEqual(
                (storeState as Record<string, any>)[attr],
                (editedState as Record<string, any>)[attr])) {
                    return true;
                }
        }

        return false;
    }    

    /**
     * Returns true if non-composite edited object's attributes/data of `objectID` are valid.
     * 
     * Always returns true for an object with "composite" object type or if it's not present in the state.
     */
    static nonCompositeObjectIsValid(state: State, objectID: number) {
        return EditedObjectsSelectors.nonCompositeObjectValidationError(state, objectID) === undefined;
    };

    /**
     * Returns validation error text for a non-composite edited object with `objectID`, if it's not valid.
     * 
     * If object is valid, has "composite" object type or not being edited, returns undefined.
     */
    static nonCompositeObjectValidationError(state: State, objectID: number) {
        const editedObject = state.editedObjects[objectID];
        if (editedObject === undefined || editedObject.object_type === "composite") return undefined;

        // Object name
        if (editedObject.object_name.length === 0) return "Object name is required.";
        if (editedObject.object_name.length > 255) return "Object name can't be longer than 255 chars.";

        // Object data
        switch (editedObject.object_type) {
            case "link":
                if (!z.string().url().safeParse(editedObject.link.link).success) return "Valid URL is required.";
                break;
            case "markdown":
                if (editedObject.markdown.raw_text.length === 0) return "Markdown text is required.";
                break;
            case "to_do_list":
                if (Object.keys(editedObject.toDoList.items).length === 0) return "At least one item is required in the to-do list.";
                break;
            default:
                throw Error(`nonCompositeObjectValidationError received an unexpected object type "${editedObject.object_type}" when validating object ${objectID}`);
        }   
    }
}


/** Thrown when trying to compare an edited object to attributes, tags or data, which are missing in the corresponding store. */
class ObjectMissingInStoreError extends Error {};


/** 
 * Returns a boolean indicating if edited object's attributes of `objectID` are modified.
 * Throws if object attributes are not present in state.objects.
 */
const attributesAreModified = (state: State, objectID: number): boolean => {
    const editedObject = state.editedObjects[objectID] as Record<string, any>;
    if (editedObject === undefined) return false;
    
    const objectAttributes = state.objects[objectID] as Record<string, any>;
    if (objectAttributes === undefined)
        throw new ObjectMissingInStoreError(`Attributes of edited object '${objectID}' are missing.`);

    for (let key of Object.keys(objectAttributes)) 
        if (!deepEqual(objectAttributes[key], editedObject[key])) return true;
    return false;
};


/** 
 * Returns a boolean indicating if edited object's tags of `objectID` are modified.
 * Throws if object's tags are not present in state.objectsTags.
 */
const tagsAreModified = (state: State, objectID: number): boolean => {
    const editedObject = state.editedObjects[objectID] as Record<string, any>;
    if (editedObject === undefined) return false;

    const objectTags = state.objectsTags[objectID];
    if (objectTags === undefined)
        throw new ObjectMissingInStoreError(`Tags of edited object '${objectID}' are missing.`);

    return editedObject.addedTags.length > 0 || editedObject.removedTagIDs.length > 0 || !deepEqual(editedObject.currentTagIDs, objectTags);
};


/** 
 * Returns a boolean indicating if edited object's data of `objectID` is modified.
 * Throws if object data is not present in a corresponding data store.
 * 
 * `mode` specifies, which attributes are not checked for modification.
 */
const dataIsModified = (state: State, objectID: number, mode: IsModifiedMode): boolean => {
    const editedObject = state.editedObjects[objectID] as Record<string, any>;
    if (editedObject === undefined) return false;

    const objectData = ObjectsSelectors.data(state, objectID);
    if (objectData === undefined)
        throw new ObjectMissingInStoreError(`Data of edited object '${objectID}' is missing.`);

    switch(editedObject.object_type) {
        case "link":
            return !deepEqual(objectData, editedObject.link);
        case "markdown":
            return (objectData as Markdown).raw_text !== editedObject.markdown.raw_text;
        case "to_do_list":
            return !deepEqual(objectData, editedObject.toDoList);
        case "composite":
            const exclusions = mode === "persist" 
                ? ["subobjects.*.is_expanded", "subobjects.*.selected_tab", "subobjects.*.fetchError"]
                : ["subobjects.*.fetchError"];
            return !deepEqual(objectData, editedObject.composite, exclusions);
        default:
            throw Error(`Incorrect object type '${editedObject.object_type}' for object ID ${objectID}`);
    }
};
