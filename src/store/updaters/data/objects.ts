import { EditedObjectsSelectors } from "../../selectors/data/objects/edited-objects";
import { ObjectsSelectors } from "../../selectors/data/objects/objects";
import { ObjectsTransformers } from "../../transformers/data/objects";

import { object } from "../../../types/store/data/objects";
import type { State } from "../../../types/store/state";
import type { ObjectAttributes, Objects, ObjectType } from "../../../types/store/data/objects";
import { type ObjectData } from "../../../types/store/general";
import { link, type Links } from "../../../types/store/data/links";
import { markdown, type MarkdownStore } from "../../../types/store/data/markdown";
import { toDoList, type ToDoLists } from "../../../types/store/data/to-do-list";
import { composite, type CompositeStore } from "../../../types/store/data/composite";
import type { BackendObjectData } from "../../../types/fetches/data/objects/general";


/** Contains state updating methods for object attributes, tags & data. */
export class ObjectsUpdaters {
    /** Returns a new state with `objects` attributes added to state.objects. */
    static addObjectsAttributes(state: State, objectsAttributes: ObjectAttributes[]): State {
        const newObjects: Objects = {};
        objectsAttributes.forEach(oa => { newObjects[oa.object_id] = object.parse(oa); });

        return { ...state, objects: { ...state.objects, ...newObjects }};
    }

    /** 
     * Returns a new state with object data from `objectsData` added to corresponding state storages.
     * `objectsData` includes `object_id`, `object_type` and `object_data` in STORE format.
     */
    static addObjectsData(state: State, objectsData: { object_id: number, object_type: ObjectType, object_data: ObjectData}[]): State {
        const newLinks: Links = {}, newMarkdown: MarkdownStore = {}, newToDoLists: ToDoLists = {}, newComposite: CompositeStore = {};

        for (let od of objectsData) {
            if (od.object_type === "link") newLinks[od.object_id] = link.parse(od.object_data);
            if (od.object_type === "markdown") newMarkdown[od.object_id] = markdown.parse(od.object_data);
            if (od.object_type === "to_do_list") newToDoLists[od.object_id] = toDoList.parse(od.object_data);
            if (od.object_type === "composite") newComposite[od.object_id] = composite.parse(od.object_data);
        }

        return {
            ...state,
            links: { ...state.links, ...newLinks },
            markdown: { ...state.markdown, ...newMarkdown },
            toDoLists: { ...state.toDoLists, ...newToDoLists },
            composite: { ...state.composite, ...newComposite }
        };
    }

    /** 
     * Returns a new state with object data from `objectsData` added to corresponding state storages.
     * `objectsData` includes `object_id`, `object_type` and `object_data` in BACKEND format.
     */
    static addObjectsDataFromBackend(state: State, objectsData: { object_id: number, object_type: ObjectType, object_data: BackendObjectData}[]): State {
        const storeObjectsData = objectsData.map(od => ({ ...od, object_data: ObjectsTransformers.backendDataToStore(od.object_data)}));
        return ObjectsUpdaters.addObjectsData(state, storeObjectsData);
    }

    /**
     * Deletes objects with `objectIDs` and their new subobjects from `state`.
     * 
     * If `deleteExistingSubobjects` is set to true, also deletes their direct subobjects.
     */
    static deleteObjects(state: State, objectIDs: number[], deleteExistingSubobjects?: boolean): State {
        // Get a full list of deleted object IDs
        let deletedObjectIDs = objectIDs;
        if (deleteExistingSubobjects) {
            // Include new & existing subobjects from all stores
            deletedObjectIDs = deletedObjectIDs.concat(ObjectsSelectors.subobjectIDs(state, objectIDs));
            deletedObjectIDs = deletedObjectIDs.concat(EditedObjectsSelectors.subobjectIDs(state, objectIDs));
        } else {
            // Include only new subobjects
            deletedObjectIDs = deletedObjectIDs.concat(EditedObjectsSelectors.newSubobjectIDs(state, objectIDs));
        }
        deletedObjectIDs = [...new Set(deletedObjectIDs)];
    
        // Deselect objects
        const selectedObjectIDs = state.objectsListUI.selectedObjectIDs.filter(id => !deletedObjectIDs.includes(id));

        // Delete from storages
        const objects = { ...state.objects }, objectsTags =  { ...state.objectsTags }, editedObjects = { ...state.editedObjects },
            links = { ...state.links }, markdown = { ...state.markdown }, toDoLists = { ...state.toDoLists }, composite = { ...state.composite };
        
        for (let store of [objects, objectsTags, editedObjects, links, markdown, toDoLists, composite]) {
            for (let objectID of deletedObjectIDs) delete store[objectID];
        }

        return {
            ...state,

            objectsListUI: { ...state.objectsListUI, selectedObjectIDs },

            objects,
            objectsTags,
            editedObjects,
            links,
            markdown,
            toDoLists,
            composite
        };
    }
}
