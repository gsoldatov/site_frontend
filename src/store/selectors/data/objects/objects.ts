import { deepCopy } from "../../../../util/copy";

import type { State } from "../../../types/state";
import type { EditedObjectDataPart } from "../../../types/data/edited-objects";
import { ObjectsTransformers } from "../../../transformers/data/objects";


export class ObjectsSelectors {
    /** Returns true if object data for the provided `objectID` exists in `state` or false otherwise. */
    static dataIsPresent(state: State, objectID: number) {
        if (!state.objects[objectID]) return false;
        const { object_type } = state.objects[objectID];

        switch (object_type) {
            case "link": return objectID in state.links;
            case "markdown": return objectID in state.markdown;
            case "to_do_list": return objectID in state.toDoLists;
            case "composite": return objectID in state.composite;
            default: throw Error(`Incorrect object type: '${object_type}'`);
        }
    };

    /** Returns object data from state or undefined, if it's absent. */
    static data(state: State, objectID: number) {
        if (!ObjectsSelectors.dataIsPresent(state, objectID)) return undefined;

        const { object_type } = state.objects[objectID];
        switch (object_type) {
            case "link": return state.links[objectID];
            case "markdown": return state.markdown[objectID];
            case "to_do_list": return state.toDoLists[objectID];
            case "composite": return state.composite[objectID];
            default: throw Error(`Incorrect object type: '${object_type}'`);
        }
    }

    /** 
     * Returns object data from state serialized as a corresponding data part of an edited object.
     * If data is not present, returns undefined.
     */
    static editedObjectData(state: State, objectID: number): EditedObjectDataPart | undefined {
        if (!ObjectsSelectors.dataIsPresent(state, objectID)) return undefined;
        const data = deepCopy(ObjectsSelectors.data(state, objectID));
        return ObjectsTransformers.storeDataToEdited(data);
    }

    /**
     * Returns a list of composite subobject IDs stored in `state.composite` for the parent `objectIDs`.
     */
    static subobjectIDs(state: State, objectIDs: number[]): number[] {
        let result: number[] = [];
        for (let objectID of objectIDs) {
            if (objectID in state.composite) {
                result = result.concat(
                    Object.keys(state.composite[objectID].subobjects).map(id => parseInt(id))
                );
            }
        }
        return result;
    }
}
