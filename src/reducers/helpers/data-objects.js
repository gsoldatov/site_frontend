import { getSubobjectDefaults } from "../../store/state-templates/composite-subobjects";


const _objectAttributes = ["object_id", "object_type", "created_at", "modified_at", "object_name", "object_description"];


/**
 *  Returns state with provided list of object attributes `objects` inserted into state.objects storage.
 */
export const getStateWithAddedObjects = (state, objects) => {
    if (!(objects instanceof Array) || objects.length === 0) return state;

    let newObjects = {};
    objects.forEach(object => {
        const object_id = object.object_id;
        newObjects[object_id] = {};
        _objectAttributes.forEach(attr => newObjects[object_id][attr] = object[attr]);
    });
    return {
        ...state,
        objects: {
            ...state.objects,
            ...newObjects
        }
    };
};


/**
 * Returns state with provided list of object data `objectData` inserted into respective object data storages.
 */
export const getStateWithAddedObjectsData = (state, objectData) => {
    if (!(objectData instanceof Array) || objectData.length === 0) return state;

    let newLinks = {}, newMarkdown = {}, newTDL = {}, newComposite = {};

    for (let od of objectData){
        switch (od["object_type"]) {
            case "link":
                newLinks[od["object_id"]] = {...od["object_data"]};
                break;
            case "markdown":
                newMarkdown[od["object_id"]] = {...od["object_data"]};
                break;
            case "to_do_list":
                let itemOrder = [], items = {};
                od["object_data"].items.forEach((item, index) => {
                    itemOrder.push(index);
                    items[index] = {...item};
                    delete items[index].item_number;
                });

                newTDL[od["object_id"]] = {
                    itemOrder,
                    setFocusOnID: -1,
                    caretPositionOnFocus: -1,
                    newItemInputIndent: 0,
                    draggedParent: -1,
                    draggedChildren: [],
                    draggedOver: -1,
                    dropIndent: 0,
                    sort_type: od["object_data"].sort_type,
                    items
                };
                break;
            case "composite":
                let subobjects = {};
                od["object_data"].subobjects.forEach(so => {
                    const { object_id, row, column, selected_tab, is_expanded } = so;
                    subobjects[object_id] = { ...getSubobjectDefaults(), row, column, selected_tab, is_expanded };
                })
                newComposite[od["object_id"]] = { subobjects };
            default:
                break;
        }
    }
    
    return {
        ...state,
        links: {
            ...state.links,
            ...newLinks
        },
        markdown: {
            ...state.markdown,
            ...newMarkdown
        },
        toDoLists: {
            ...state.toDoLists,
            ...newTDL
        },
        composite: {
            ...state.composite,
            ...newComposite
        }
    };
};


/**
 *  Returns state with provided list of object data `objectIDs` removed from the storages and selections.
 * 
 *  If `deleteSubobjects` is true, also deleted all subobjects of composite objects in `objectIDs`.
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
    const newSelectedObjectIDs = state.objectsUI.selectedObjectIDs.filter(objectID => objectIDs.indexOf(objectID) === -1);
    
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
        objectsUI: {
            ...state.objectsUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
};
