/** 
 * Returns state with provided list of object data `objectIDs` removed from the storages and selections.
 * 
 * If `deleteSubobjects` is true, also deleted all subobjects of composite objects in `objectIDs`.
 * 
 * TODO move into edited objects updaters; make separate getters for direct subobjects & for new subobjects
 */
export const getStateWithDeletedObjects = (state, objectIDs, deleteSubobjects) => {
    if (objectIDs.length === 0) return state;

    const subobjectIDs = new Set();

    // If deleting with subobjects, add all subobjects of composite objects
    if (deleteSubobjects)
        for (let objectID of objectIDs) {
            // Look up both state.composite & state.editedObjects for subobjects        
            if (objectID in state.composite)
                for (let subobjectID of Object.keys(state.composite[objectID].subobjects)) subobjectIDs.add(parseInt(subobjectID));
            
            if (objectID in state.editedObjects)
                for (let subobjectID of Object.keys(state.editedObjects[objectID].composite.subobjects)) subobjectIDs.add(parseInt(subobjectID));
        }
    // If not deleting subobjects, delete only new composite subobjects
    else {
        for (let objectID of objectIDs) {
            if (objectID in state.editedObjects) {
                for (let subobjectID of Object.keys(state.editedObjects[objectID].composite.subobjects)) {
                    if (parseInt(subobjectID) < 0) {
                        subobjectIDs.add(parseInt(subobjectID));
                    }
                }
            }
        }
    }

    objectIDs = objectIDs.concat(...subobjectIDs);
    
    // Deselect objects
    const newSelectedObjectIDs = state.objectsListUI.selectedObjectIDs.filter(objectID => objectIDs.indexOf(objectID) === -1);
    
    // Remove from storage
    const storageNames = ["objects", "links", "markdown", "toDoLists", "composite", "objectsTags", "editedObjects"];
    const newStorages = {};
    storageNames.forEach(storage => newStorages[storage] = { ...state[storage] });

    for (let objectID of objectIDs)
        storageNames.forEach(storage => {
            delete newStorages[storage][objectID];
        });
    
    return { 
        ...state, 
        ...newStorages,
        objectsListUI: {
            ...state.objectsListUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
};
