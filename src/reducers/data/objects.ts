import { object } from "../../store/types/data/objects";

import type { PartialExcept } from "../../util/types/common";
import type { State } from "../../store/types/state";
import type { ObjectAttributes, Objects } from "../../store/types/data/objects";


/** Performs partial update of objects' attributes in `state.objects` with values contained in `objects` array. */
export const updateObjects = (objects: PartialExcept<ObjectAttributes, "object_id">[]) => ({ type: "UPDATE_OBJECTS", objects });

export const _updateObjects = (state: State, action: { objects: PartialExcept<ObjectAttributes, "object_id">[] }): State => {
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

export const objectsRoot = {
    "UPDATE_OBJECTS": _updateObjects
};
