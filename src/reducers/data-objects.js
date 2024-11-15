import { ADD_OBJECTS, ADD_OBJECTS_DATA, DELETE_OBJECTS, UPDATE_OBJECTS_DATA } from "../actions/data-objects";
import { deepMerge } from "../util/copy";

import { getStateWithAddedObjectsData, getStateWithDeletedObjects } from "./helpers/data-objects";
import { ObjectsUpdaters } from "../store/updaters/data/objects";


const addObjects = (state, action) => {
    return ObjectsUpdaters.addObjectsAttributes(state, action.objects);
};

const addObjectsData = (state, action) => {
    return getStateWithAddedObjectsData(state, action.objectData);
}

const updateObjectsData = (state, action) => {
    const { objectData } = action;
    let newLinks = {}, newMarkdown = {}, newTDL = {}, newComposite = {};

    objectData.forEach(data => {
        const { object_id, object_type, object_data } = data;
        if (object_type === "link") newLinks[object_id] = deepMerge(state.links[object_id], object_data);
        else if (object_type === "markdown") newMarkdown[object_id] = deepMerge(state.markdown[object_id], object_data);
        else if (object_type === "to_do_list") newTDL[object_id] = deepMerge(state.toDoLists[object_id], object_data);
        else if (object_type === "composite") newComposite[object_id] = deepMerge(state.composite[object_id], object_data);
        else throw Error("Not implemented");
    });

    return {
        ...state,
        links: { ...state.links, ...newLinks },
        markdown: { ...state.markdown, ...newMarkdown },
        toDoLists: { ...state.toDoLists, ...newTDL },
        composite: { ...state.composite, ...newComposite }
    };
};

const deleteObjects = (state, action) => {
    return getStateWithDeletedObjects(state, action.objectIDs, action.deleteSubobjects);
}


const root = {
    ADD_OBJECTS: addObjects,
    ADD_OBJECTS_DATA: addObjectsData,
    UPDATE_OBJECTS_DATA: updateObjectsData,
    DELETE_OBJECTS: deleteObjects
};

export default root;
