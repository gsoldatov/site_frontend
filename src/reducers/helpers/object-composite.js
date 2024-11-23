import { EditedObjectsSelectors } from "../../store/selectors/data/objects/edited-objects";
import { ObjectsUpdaters } from "../../store/updaters/data/objects";
import { getStateWithDeletedEditedNewSubobjects } from "./object";

import { SubobjectDeleteMode } from "../../store/types/data/composite";
import { deepCopy } from "../../util/copy";


/**
 * Processes update commands for a composite object and its subobjects and returns the state after updates.
 */
export const getStateWithCompositeUpdate = (state, objectID, update) => {
    const { command } = update;

    // Updates state after add or update of a composite object:
    // - removes any new subobjects from state.editedObjects if the main object is not composite (for when it was changed after subobject creation);
    // 
    // - removes deleted and fully deleted existing subobjects from state;
    // - updates new & modified subobjects in state.editedObjects (maps subobject IDs & created_at & modified_at timestamps);
    // - adds new & modified subobject attributes & data to state storages;
    // - adds empty records in objectsTags storage for new subobjects;
    // - maps subobject IDs of the saved composite object and removes deleted subobjects in state.editedObjects[objectID];
    // - updates subobject row positions in state.editedObjects[objectID].
    // Object attributes, tags & data of the saved object are added to the storages in the add/update fetch functions.

    // TODO add typing
    if (command === "updateSubobjectsOnSave") {
        // `object` contains response object attributes & data, `object_data` contains object data as it was sent in request
        const { object, object_data } = update;

        // If object is not composite, delete any new subobjects which were created before object type was changed
        if (object.object_type !== "composite") return getStateWithDeletedEditedNewSubobjects(state, [objectID]);
        let newState = state;

        // Remove new and unchanged (non-fully) deleted existing objects from state
        let subobjectIDs = Object.keys(newState.editedObjects[objectID].composite.subobjects);
        const deletedSubobjectIDs = subobjectIDs.filter(subobjectID => 
                                    newState.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.subobjectOnly
                                    && EditedObjectsSelectors.isNewOrUnchangedExisting(newState, subobjectID));
        newState = ObjectsUpdaters.deleteObjects(newState, deletedSubobjectIDs);
        
        // Remove fully deleted existing objectsfrom state
        let fullyDeletedExistingSubobjectIDs = subobjectIDs.filter(subobjectID => {
            return parseInt(subobjectID) > 0 && newState.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.full
        });
        newState = ObjectsUpdaters.deleteObjects(newState, fullyDeletedExistingSubobjectIDs);

        // Map new subobject IDs in state.editedObjects and update object_id, created_at & modified_at values
        // Also add empty records in objectsTags storage for new subobjects
        const objectUpdateTimeStamp = object.modified_at;
        const IDMapping = object.object_data.id_mapping;
        const modifiedExistingSubobjectIDs = object_data.subobjects.filter(so => so.object_id > 0 && so.object_name !== undefined).map(so => so.object_id);
        let newEditedObjects = {}, newObjectsTags = {};
        for (let oldObjectID of Object.keys(newState.editedObjects)) {
            const isNewSubobject = IDMapping[oldObjectID] !== undefined;
            const isModifiedExistingSubobject = modifiedExistingSubobjectIDs.indexOf(parseInt(oldObjectID)) > -1;

            // If edited object was a new subobject, copy it, update its ID and add created_at & modified_at values
            // Add an empty list as its current tags
            if (isNewSubobject) {
                const newObjectID = IDMapping[oldObjectID];
                newEditedObjects[newObjectID] = { ...newState.editedObjects[oldObjectID] };
                newEditedObjects[newObjectID].object_id = newObjectID;
                newEditedObjects[newObjectID].created_at = objectUpdateTimeStamp;
                newEditedObjects[newObjectID].modified_at = objectUpdateTimeStamp;
                newObjectsTags[newObjectID] = [];
            }
            // If edited object was an existing modified subobject, copy it and update its modified_at value
            else if (isModifiedExistingSubobject) {
                newEditedObjects[oldObjectID] = { ...newState.editedObjects[oldObjectID] };
                newEditedObjects[oldObjectID].modified_at = objectUpdateTimeStamp;
            }
            // If edited object was not updated, do not copy it
            else {
                newEditedObjects[oldObjectID] = newState.editedObjects[oldObjectID];
            }
        }
        newState = { ...newState, editedObjects: newEditedObjects, objectsTags: { ...state.objectsTags, ...newObjectsTags } };

        // Filter new & modified existing subobjects and map new subobject IDs from object_data
        let subobjectsToAddToState = object_data.subobjects.filter(so => so.object_name !== undefined).map(so => {
            const newSO = deepCopy(so);
            const newObjectID = IDMapping[so.object_id];
            if (newObjectID !== undefined) {
                newSO.object_id = newObjectID;
                newSO.created_at = objectUpdateTimeStamp;
                newSO.modified_at = objectUpdateTimeStamp;
            } else {
                newSO.created_at = newState.objects[so.object_id].created_at;
                newSO.modified_at = objectUpdateTimeStamp;
            }
            return newSO;
        });

        // Add new & modified existing attributes & data to state
        newState = ObjectsUpdaters.addObjectsAttributes(newState, subobjectsToAddToState);
        newState = ObjectsUpdaters.addObjectsDataFromBackend(newState, subobjectsToAddToState);
        
        // Map subobjectIDs of the composite object and remove deleted subobjects in state.editedObjects[objectID].
        // Update row positions of non-deleted objects.
        const newRowPositions = {};
        object_data.subobjects.forEach(so => {
            newRowPositions[so.object_id] = so.row;
        });
        const newComposite = { ...newState.editedObjects[objectID].composite };
        const newSubobjects = {};
        Object.keys(newComposite.subobjects).forEach(subobjectID => {
            // Filter out deleted subobjects
            if (deletedSubobjectIDs.indexOf(subobjectID) > -1 || fullyDeletedExistingSubobjectIDs.indexOf(subobjectID) > -1) return;

            const mappedSubobjectID = subobjectID in IDMapping ? IDMapping[subobjectID] : subobjectID;
            newSubobjects[mappedSubobjectID] = { ...newComposite.subobjects[subobjectID], row: newRowPositions[subobjectID] };
        });
        newComposite.subobjects = newSubobjects;

        newState = {
            ...newState,
            editedObjects: {
                ...newState.editedObjects,
                [objectID]: {
                    ...newState.editedObjects[objectID],
                    composite: newComposite
                }
            }
        };

        return newState;
    }
}
