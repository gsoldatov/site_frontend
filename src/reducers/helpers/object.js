import { deepCopy } from "../../util/copy";

import { ObjectsSelectors } from "../../store/selectors/data/objects/objects";
import { getEditedObjectState } from "../../store/types/data/edited-objects";


/** 
 * Resets state of edited objects with provided `objectIDs` to their last saved states.
 * 
 * Sets default attribute/tag/data values if `objectID` is not found in respective storage and `allowResetToDefaults` is true.
 * 
 * Throws an Error if attribute/tag/data are not found and `allowResetToDefaults` is false.
 * 
 * If `defaultDisplayInFeed` is provided, all objects without saved object attributes have their `display_in_feed` set to this value.
 */
export const getStateWithResetEditedObjects = (state, objectIDs, { allowResetToDefaults, defaultDisplayInFeed } = {}) => {
    if (objectIDs.length === 0) return state;

    const throwIfDataIsMissing = (data, msg) => {
        if (data === undefined && !allowResetToDefaults)
            throw Error(msg);
    };

    const newEditedObjects = {...state.editedObjects};
    objectIDs.forEach(objectID => {
        const object_id = parseInt(objectID);
        const overrideValues = { object_id };
        if (defaultDisplayInFeed !== undefined) overrideValues.display_in_feed = defaultDisplayInFeed;
        let stateAfterReset = getEditedObjectState(overrideValues);

        // Set object attributes
        const attributes = state.objects[objectID];
        throwIfDataIsMissing(attributes, `Failed to reset object ${objectID}: attributes are missing.`);
        stateAfterReset = {
            ...stateAfterReset, 
            ...deepCopy(state.objects[objectID] || {})
        };

        // Set object's `owner_id` to current user, if it's not set after attributes reset
        if (stateAfterReset.owner_id <= 0) stateAfterReset.owner_id = state.auth.user_id;
        
        // Set object's current tags (added & removed tags are already reset)
        const tags = state.objectsTags[objectID];
        throwIfDataIsMissing(tags, `Failed to reset object ${objectID}: tags are missing.`);
        stateAfterReset = {
            ...stateAfterReset,
            currentTagIDs: (tags || []).slice()
        };
        
        // Set object data
        const data = ObjectsSelectors.editedObjectData(state, objectID);    // TODO if refactored, so that undefined is not returned here, make `editedObjectData` throw when data is missing
        throwIfDataIsMissing(data, `Failed to reset object ${objectID}: data is missing.`);
        stateAfterReset = {
            ...stateAfterReset,
            ...(data || {})
        };        
        
        newEditedObjects[objectID] = stateAfterReset;
    });

    return { ...state, editedObjects: newEditedObjects };
};


/** 
 * Deletes all new subobjects of each composite object in `objectIDs` from state.editedObjects.
 * 
 * Returns the state after deletes.
 */
export const getStateWithDeletedEditedNewSubobjects = (state, objectIDs) => {
    if (objectIDs.length === 0) return state;
    let newEditedObjects = { ...state.editedObjects };

    objectIDs.forEach(objectID => {
        if (!(objectID in newEditedObjects)) return;

        // Non-composite objects' check is required for deleting new subobjects of a new object, if its type was switched from composite before save.
        // if (!(objectID in newEditedObjects) || newEditedObjects[objectID].object_type !== "composite") return;

        Object.keys(newEditedObjects[objectID].composite.subobjects).forEach(subobjectID => {
            if (parseInt(subobjectID) < 0) delete newEditedObjects[subobjectID];
        });
    });

    return { ...state, editedObjects: newEditedObjects };
};
