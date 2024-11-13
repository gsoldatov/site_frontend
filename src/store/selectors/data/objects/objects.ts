import { deepCopy } from "../../../../util/copy";

import type { State } from "../../../types/state";
import type { EditedObjectDataPart } from "../../../types/data/edited-objects";
import type { Link } from "../../../types/data/links";
import type { Markdown } from "../../../types/data/markdown";
import type { ToDoList } from "../../../types/data/to-do-list";
import type { Composite } from "../../../types/data/composite";


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

        const { object_type } = state.objects[objectID];
        switch (object_type) {
            case "link": return { link: data as Link };
            case "markdown": return { markdown: data as Markdown };
            case "to_do_list": return  { toDoList: data as ToDoList };
            case "composite": return { composite: data as Composite }
        }
    }

    
}


// /**
//  * Returns object data from `state` storage for the provided `objectID`.
//  * 
//  * If `formatAsEditedObjectProps` is true, returns a deep copy of data formatted to be inserted into an edited object,
//  * otherwise returns the reference to the original object in the storage.
//  * 
//  * If object data or attributes (object type is required) are not present, returns `undefined`.
//  * 
//  * TODO move transformation part to transformers
//  */
// export const getObjectDataFromStore = (state, objectID, formatAsEditedObjectProps) => {
//     if (!dataIsPresent(state, objectID)) return undefined;

//     const objectType = state.objects[objectID].object_type;
//     switch (objectType) {
//         case "link":
//             return formatAsEditedObjectProps
//                 ? { link: deepCopy(state.links[objectID]) }
//                 : state.links[objectID];
//         case "markdown":
//             return formatAsEditedObjectProps
//                 ? (state.markdown[objectID] ? { markdown: { raw_text: state.markdown[objectID].raw_text, parsed: "" }} : undefined)
//                 : state.markdown[objectID];
//         case "to_do_list":
//             return formatAsEditedObjectProps
//                 ? { toDoList: deepCopy(state.toDoLists[objectID]) }
//                 : state.toDoLists[objectID];
//         case "composite":
//             return formatAsEditedObjectProps
//                 ? { composite: deepCopy(state.composite[objectID]) }
//                 : state.composite[objectID];
//         default:
//             return undefined;
//     }
// };


/*
 TODO 
 - `objectHasNoChanges`, `objectAttributesAreModified`, `objectTagsAreModified` & `objectDataIsModified`:
    - move to editedObjects selectors;
    - check if possible & refactor to accept state & objectID only:
        +- `objectAttributesAreModified`;
        +- `objectTagsAreModified`;
        +- `objectDataIsModified`;
    - objectHasNoChanges:
        - refactor to `isModified` version (reverse true & false results);
        ? refactor to remove default param (use another func to chech for presence?);


 */


// /**
//  * Returns true if state of the object with provided `objectID` in state.editedObjects has no changes compared to its last saved state (or default edited object state, if object is new).
//  * 
//  * If object is not present in any of the storages (state.editedObjects, state.objects, state.objectsTags, data storages), returns `defaultReturnValue` (defaults to true).
//  */
// export const objectHasNoChanges = (state, objectID, defaultReturnValue) => {
//     // New edited object
//     if (objectID === 0) return deepEqual(state.editedObjects[objectID], getEditedObjectState({ object_id: 0, display_in_feed: true, owner_id: state.auth.user_id }));

//     // Existing edited object
//     // Return default value if objectID is missing is editedObjects or attribute / tag / data storages
//     defaultReturnValue = defaultReturnValue !== undefined ? defaultReturnValue : true;
//     if (!state.editedObjects.hasOwnProperty(objectID) || !state.objects.hasOwnProperty(objectID) || !state.objectsTags.hasOwnProperty(objectID) || !dataIsPresent(state, objectID)) 
//         return defaultReturnValue;
    
//     const object = state.objects[objectID], objectTags = state.objectsTags[objectID], objectData = ObjectsSelectors.data(state, objectID),
//         editedObject = state.editedObjects[objectID];
    
//     // Check object attributes
//     if (objectAttributesAreModified(object, editedObject)) return false;

//     // Check object tags
//     if (objectTagsAreModified(objectTags, editedObject)) return false;

//     // Check object data
//     if (objectDataIsModified(objectData, editedObject)) return false;

//     // No changes were made
//     return true;
// };



// /**
//  * Accepts saved object attributes `object` and edited object state `editedObject`.
//  * 
//  * Returns true if object attributes in `editedObjects` are different than in `object`.
//  * 
//  * If `object` or `editedObject` are undefined, returns false.
//  */
// export const objectAttributesAreModified = (object, editedObject) => {
//     if (object === undefined || editedObject === undefined) return false;

//     for (let key of Object.keys(object))
//         if (!deepEqual(object[key], editedObject[key])) return true;
    
//     return false;
// };


// /**
//  * Accepts saved object tags `objectTags` and an edited object state `editedObject`.
//  * 
//  * Returns true if object tags in `editedObject` are modified.
//  * 
//  * If object is not present in state.editedObjects, returns false.
//  */
// export const objectTagsAreModified = (objectTags, editedObject) => {
//     if (editedObject === undefined) return false;

//     return editedObject.addedTags.length > 0 || editedObject.removedTagIDs.length > 0 || 
//         (editedObject.object_id > 0 && !deepEqual(editedObject.currentTagIDs, objectTags));  // don't compare currentTagIDs for new objects
// };


// /**
//  * Accepts saved in a storage object data `objectData` and an edited object state `editedObject`.
//  * 
//  * Returns true if object data `editedObject` is modified.
//  * 
//  * If `objectData` or `editedObject` are undefined, returns false.
//  * 
//  * If object is not present in state.editedObjects or corresponding data storage, returns false.
//  */
// export const objectDataIsModified = (objectData, editedObject) => {
//     if (objectData === undefined || editedObject === undefined) return false;

//     switch(editedObject.object_type) {
//         case "link":
//             return !deepEqual(objectData, editedObject.link);
//         case "markdown":
//             return objectData.raw_text !== editedObject.markdown.raw_text;
//         case "to_do_list":
//             return !deepEqual(objectData, editedObject.toDoList);
//         case "composite":
//             return !deepEqual(objectData, editedObject.composite);
//         default:
//             throw Error(`objectDataIsModified received an unexpected object type ${editedObject.object_type} when checking object ${editedObject.objectID}`);
//     }
// };
