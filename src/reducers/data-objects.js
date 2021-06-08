import { ADD_OBJECTS, ADD_OBJECT_DATA, DELETE_OBJECTS } from "../actions/data-objects";

import { getStateWithAddedObjects, getStateWithAddedObjectsData, getStateWithDeletedObjects } from "./helpers/data-objects";
import { subobjectDefaults } from "../store/state-templates/composite-subobjects";


function addObjects(state, action) {
    return getStateWithAddedObjects(state, action.objects);
};

function addObjectData(state, action) {
    return getStateWithAddedObjectsData(state, action.objectData);
}

function deleteObjects(state, action) {
    return getStateWithDeletedObjects(state, action.objectIDs, action.deleteSubobjects);
}


const root = {
    ADD_OBJECTS: addObjects,
    ADD_OBJECT_DATA: addObjectData,
    DELETE_OBJECTS: deleteObjects
};

export default root;
