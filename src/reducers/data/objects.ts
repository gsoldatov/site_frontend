import { ObjectsUpdaters } from "../../store/updaters/data/objects";

import { object } from "../../store/types/data/objects";
import type { PartialExcept } from "../../util/types/common";
import type { State } from "../../store/types/state";
import type { ObjectAttributes, Objects, ObjectType } from "../../store/types/data/objects";
import { type BackendObjectData } from "../../fetches/types/data/objects";


/** Adds objects' attributes from `objects` into state.objects store. */
export const addObjectsAttributes = (objectsAttributes: ObjectAttributes[]) => ({ type: "ADD_OBJECTS_ATTRIBUTES", objectsAttributes });

const _addObjectsAttributes = (state: State, action: { objectsAttributes: ObjectAttributes[] }): State => {
    return ObjectsUpdaters.addObjectsAttributes(state, action.objectsAttributes);
};


/** Performs partial update of objects' attributes in `state.objects` with values contained in `objects` array. */
export const updateObjectsAttributes = (objects: PartialExcept<ObjectAttributes, "object_id">[]) => ({ type: "UPDATE_OBJECTS_ATTRIBUTES", objects });

export const _updateObjectsAttributes = (state: State, action: { objects: PartialExcept<ObjectAttributes, "object_id">[] }): State => {
    const updatedObjects = action.objects.reduce((result, attributeUpdates) => {
        const { object_id } = attributeUpdates;
        const currentAttributes = state.objects[object_id];
        if (currentAttributes === undefined) throw Error(`Attempted to updated attributes of object '${object_id}', which is missing in the state.`);
        const newAttributes = object.parse({ ...currentAttributes, ...attributeUpdates });
        result[object_id] = newAttributes;
        return result;
    }, {} as Objects);

    return { ...state, objects: { ...state.objects, ...updatedObjects } };
};


/** Adds objects data in backend format to the store. */
export const addObjectsDataFromBackend = (objectsData: { object_id: number, object_type: ObjectType, object_data: BackendObjectData }[]) =>
    ({ type: "ADD_OBJECTS_DATA_FROM_BACKEND", objectsData });

const _addObjectsDataFromBackend = (state: State, action: { objectsData: { object_id: number, object_type: ObjectType, object_data: BackendObjectData }[] }): State => {
    return ObjectsUpdaters.addObjectsDataFromBackend(state, action.objectsData);
};


export const objectsRoot = {
    "ADD_OBJECTS_ATTRIBUTES": _addObjectsAttributes,
    "UPDATE_OBJECTS_ATTRIBUTES": _updateObjectsAttributes,
    "ADD_OBJECTS_DATA_FROM_BACKEND": _addObjectsDataFromBackend
};
