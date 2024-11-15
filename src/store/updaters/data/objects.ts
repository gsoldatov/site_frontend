import { object } from "../../types/data/objects";

import type { State } from "../../types/state";
import type { ObjectAttributes, Objects } from "../../types/data/objects";


/** Contains state updating methods for object attributes, tags & data. */
export class ObjectsUpdaters {
    /** Returns a new state with `objects` attributes added to state.objects. */
    static addObjectsAttributes(state: State, objects: ObjectAttributes[]): State {
        const newObjects: Objects = {};
        objects.forEach(o => {
            newObjects[o.object_id] = object.parse(o)
        });

        return { ...state, objects: { ...state.objects, ...newObjects }};
    }
}
