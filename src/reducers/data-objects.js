import { ADD_OBJECTS, ADD_OBJECT_DATA, DELETE_OBJECTS } from "../actions/data-objects";

import { addObjectsToState, addObjectDataToState } from "./helpers/data-objects";
import { subobjectDefaults } from "../store/state-templates/composite-subobjects";


function addObjects(state, action) {
    return addObjectsToState(state, action.objects);
};

function addObjectData(state, action) {
    return addObjectDataToState(state, action.objectData);
}

function deleteObjects(state, action) {
    let objects = {...state.objects};
    let links = {...state.links};
    let markdown = {...state.markdown};
    let toDoLists = {...state.toDoLists};
    let objectsTags = {...state.objectsTags};
    let editedObjects = {...state.editedObjects};
    for (let objectID of action.object_ids) {
        delete objects[objectID];
        delete links[objectID];
        delete markdown[objectID];
        delete toDoLists[objectID];
        delete objectsTags[objectID];
        delete editedObjects[objectID];
    }

    return {
        ...state,
        objects,
        links,
        markdown,
        toDoLists,
        objectsTags,
        editedObjects
    };
}


const root = {
    ADD_OBJECTS: addObjects,
    ADD_OBJECT_DATA: addObjectData,
    DELETE_OBJECTS: deleteObjects
};

export default root;
