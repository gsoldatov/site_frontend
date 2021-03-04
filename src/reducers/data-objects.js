import { ADD_OBJECTS, ADD_OBJECT_DATA, DELETE_OBJECTS } from "../actions/data-objects";


const _objectAttributes = ["object_id", "object_type", "created_at", "modified_at", "object_name", "object_description"];
function addObjects(state, action) {
    let newObjects = {};
    action.objects.forEach(object => {
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

function addObjectData(state, action) {
    let newLinks = {}, newMarkdown = {}, newTDL = {};


    for (let objectData of action.objectData){
        switch (objectData["object_type"]) {
            case "link":
                newLinks[objectData["object_id"]] = {...objectData["object_data"]};
                break;
            case "markdown":
                newMarkdown[objectData["object_id"]] = {...objectData["object_data"]};
                break;
            case "to_do_list":
                let itemOrder = [], items = {};
                objectData["object_data"].items.forEach((item, index) => {
                    itemOrder.push(index);
                    items[index] = {...item};
                    delete items[index].item_number;
                });

                newTDL[objectData["object_id"]] = {
                    itemOrder,
                    setFocusOnID: -1,
                    caretPositionOnFocus: -1,
                    newItemInputIndent: 0,
                    draggedParent: -1,
                    draggedChildren: [],
                    draggedOver: -1,
                    dropIndent: 0,
                    sort_type: objectData["object_data"].sort_type,
                    items
                };
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
        }
    };
}

function deleteObjects(state, action) {
    let objects = {...state.objects};
    let links = {...state.links};
    let markdown = {...state.markdown};
    let toDoLists = {...state.toDoLists};
    let objectsTags = {...state.objectsTags};
    for (let objectID of action.object_ids) {
        delete objects[objectID];
        delete links[objectID];
        delete markdown[objectID];
        delete toDoLists[objectID];
        delete objectsTags[objectID];
    }

    return {
        ...state,
        objects,
        links,
        markdown,
        toDoLists,
        objectsTags
    };
}


const root = {
    ADD_OBJECTS: addObjects,
    ADD_OBJECT_DATA: addObjectData,
    DELETE_OBJECTS: deleteObjects
};

export default root;
