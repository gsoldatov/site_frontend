import { getSubobjectDefaults } from "../../store/state-templates/composite-subobjects";
import { objectAttributes, defaultEditedObjectState } from "../../store/state-templates/edited-object";
import { deepCopy } from "../../util/copy";


/**
 *  Returns state with provided list of object attributes `objects` inserted into state.objects storage.
 */
export const getStateWithAddedObjects = (state, objects) => {
    if (!(objects instanceof Array) || objects.length === 0) return state;

    let newObjects = {};
    objects.forEach(object => {
        const object_id = object.object_id;
        newObjects[object_id] = {};
        objectAttributes.forEach(attr => newObjects[object_id][attr] = object[attr]);
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
                const link = deepCopy(defaultEditedObjectState.link);
                for (let attr of Object.keys(link))
                    if (attr in od.object_data) link[attr] = od.object_data[attr];
                newLinks[od.object_id] = link;
                break;
            
            case "markdown":
                const markdown = deepCopy(defaultEditedObjectState.markdown);
                for (let attr of Object.keys(markdown))
                    if (attr in od.object_data) markdown[attr] = od.object_data[attr];
                newMarkdown[od.object_id] = markdown;
                break;
            
            case "to_do_list":
                const toDoList = deepCopy(defaultEditedObjectState.toDoList);

                let itemOrder = [], items = {};
                od["object_data"].items.forEach((item, index) => {
                    itemOrder.push(index);
                    items[index] = {...item};
                    delete items[index].item_number;
                });

                toDoList.items = items;
                toDoList.itemOrder = itemOrder;
                toDoList.sort_type = od.object_data.sort_type;

                newTDL[od.object_id] = toDoList;
                break;
            
            case "composite":
                const composite = deepCopy(defaultEditedObjectState.composite);
                for (let attr of Object.keys(composite))
                    if (attr in od.object_data && attr !== "subobjects") composite[attr] = od.object_data[attr];
                
                composite.subobjects = {};
                od.object_data.subobjects.forEach(so => {
                    const subobject = getSubobjectDefaults();
                    for (let attr of Object.keys(subobject))
                        if (attr in so) subobject[attr] = so[attr];
                    composite.subobjects[so.object_id] = subobject;
                });
                
                newComposite[od.object_id] = composite;
                break;
                
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
