import { object } from "../../types/data/objects";

import type { State } from "../../types/state";
import type { ObjectAttributes, Objects, ObjectType } from "../../types/data/objects";
import { type ObjectData } from "../../types/general";
import { link, type Links } from "../../types/data/links";
import { markdown, type MarkdownStore } from "../../types/data/markdown";
import { toDoList, type ToDoLists } from "../../types/data/to-do-list";
import { composite, type CompositeStore } from "../../types/data/composite";
import type { BackendObjectData } from "../../../fetches/types/data/objects";
import { ObjectsTransformers } from "../../transformers/data/objects";


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
}
