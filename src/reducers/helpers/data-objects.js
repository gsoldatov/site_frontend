import { subobjectDefaults } from "../../store/state-templates/composite-subobjects";


const _objectAttributes = ["object_id", "object_type", "created_at", "modified_at", "object_name", "object_description"];


// Returns state with provided list of object attributes `objects` inserted into state.objects storage.
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


// Returns state with provided list object data `objectData` inserted into respective object data storages.
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
                    const { object_id, row, column, selected_tab } = so;
                    subobjects[object_id] = { ...subobjectDefaults, row, column, selected_tab };
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
