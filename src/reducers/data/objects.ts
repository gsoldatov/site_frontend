import { ObjectsUpdaters } from "../../store/updaters/data/objects";
import { deepMerge } from "../../util/copy";

import type { DeepPartial } from "../../util/types/common";
import { object } from "../../store/types/data/objects";
import type { PartialExcept } from "../../util/types/common";
import type { State } from "../../store/types/state";
import type { ObjectAttributes, Objects, ObjectType } from "../../store/types/data/objects";
import { type BackendObjectData } from "../../fetches/types/data/objects/general";
import { ObjectDataMap } from "../../store/types/general";
import { links, type Links } from "../../store/types/data/links";
import { markdownStore, type MarkdownStore } from "../../store/types/data/markdown";
import { toDoLists, type ToDoLists } from "../../store/types/data/to-do-list";
import { compositeStore, type CompositeStore } from "../../store/types/data/composite";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Adds objects' attributes from `objects` into state.objects store. */
export const addObjectsAttributes = (objectsAttributes: ObjectAttributes[]) => ({ type: "ADD_OBJECTS_ATTRIBUTES", objectsAttributes });

const _addObjectsAttributes = (state: State, action: { objectsAttributes: ObjectAttributes[] }): State => {
    return ObjectsUpdaters.addObjectsAttributes(state, action.objectsAttributes);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Adds objects data in backend format to the store. */
export const addObjectsDataFromBackend = (objectsData: { object_id: number, object_type: ObjectType, object_data: BackendObjectData }[]) =>
    ({ type: "ADD_OBJECTS_DATA_FROM_BACKEND", objectsData });

const _addObjectsDataFromBackend = (state: State, action: { objectsData: { object_id: number, object_type: ObjectType, object_data: BackendObjectData }[] }): State => {
    return ObjectsUpdaters.addObjectsDataFromBackend(state, action.objectsData);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type UpdateObjectsData<T extends ObjectType> = { object_id: number, object_type: T, object_data: DeepPartial<ObjectDataMap<T>> };

/** 
 * Performs partial updates of existing object data in the data stores.
 * 
 * `object_data` can contain deeply partial prop values for existing data.
 * 
 * Record substores (to-do list items, composite subobjects) can receive partial updates for existing keys.
 * New values, however must be specified fully in order to be added.
 */
export const updateObjectsData = <T extends ObjectType>(objectsData: UpdateObjectsData<T>[]) => ({ type: "UPDATE_OBJECTS_DATA", objectsData });

const _updateObjectsData = <T extends ObjectType>(state: State, action: { objectsData: UpdateObjectsData<T>[] }): State => {
    const { objectsData } = action;
    let newLinks: Links = {}, newMarkdown: MarkdownStore = {}, newToDoLists: ToDoLists = {}, newComposite: CompositeStore = {};

    objectsData.forEach(data => {
        const { object_id, object_type, object_data } = data;
        if (object_type === "link") newLinks[object_id] = deepMerge(state.links[object_id], object_data);
        else if (object_type === "markdown") newMarkdown[object_id] = deepMerge(state.markdown[object_id], object_data);
        else if (object_type === "to_do_list") newToDoLists[object_id] = deepMerge(state.toDoLists[object_id], object_data);
        else if (object_type === "composite") newComposite[object_id] = deepMerge(state.composite[object_id], object_data);
        else throw Error("Not implemented");
    });

    // Validate updated data
    newLinks = links.parse(newLinks);
    newMarkdown = markdownStore.parse(newMarkdown);
    newToDoLists = toDoLists.parse(newToDoLists);
    newComposite = compositeStore.parse(newComposite);

    return {
        ...state,
        links: { ...state.links, ...newLinks },
        markdown: { ...state.markdown, ...newMarkdown },
        toDoLists: { ...state.toDoLists, ...newToDoLists },
        composite: { ...state.composite, ...newComposite }
    };
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Deletes objects with `objectIDs` and their new subobjects from the state.
 * 
 * If `deleteSubobjects` is true, deletes their existing subobjects as well.
 */
export const deleteObjects = (objectIDs: number[], deleteExistingSubobjects: boolean) => ({ type: "DELETE_OBJECTS", objectIDs, deleteExistingSubobjects });

const _deleteObjects = (state: State, action: { objectIDs: number[], deleteExistingSubobjects: boolean }): State => {
    return ObjectsUpdaters.deleteObjects(state, action.objectIDs, action.deleteExistingSubobjects);
};


export const objectsRoot = {
    "ADD_OBJECTS_ATTRIBUTES": _addObjectsAttributes,
    "UPDATE_OBJECTS_ATTRIBUTES": _updateObjectsAttributes,
    "ADD_OBJECTS_DATA_FROM_BACKEND": _addObjectsDataFromBackend,
    "UPDATE_OBJECTS_DATA": _updateObjectsData,
    "DELETE_OBJECTS": _deleteObjects
};
