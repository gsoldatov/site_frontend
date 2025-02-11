import { ObjectGenerator, type ToDoListItemData, type CompositeSubobjectData } from "./objects";

import type { PartialExcept } from "../../../src/types/common";
import type { ToDoList } from "../../../src/types/store/data/to-do-list";
import { SubobjectDeleteMode, type CompositeSubobjects } from "../../../src/types/store/data/composite";


type ToDoListItems = ToDoList["items"];
/** Custom values for a generated to-do list item inside an edited object. */
type ToDoListItemParams = PartialExcept<ToDoListItemData, "item_number">;
/** Custom values for a generated composite subobject inside an edited object. */
type CompositeSubobjectParams = PartialExcept<CompositeSubobjectData, "subobject_id" | "column" | "row"> & {
    deleteMode?: SubobjectDeleteMode,
    fetchError?: string
};


/**
 * Data generator class for edited objects.
 */
export class EditedObjectGenerator {
    object: ObjectGenerator

    constructor() {
        this.object = new ObjectGenerator();
    }

    /**
     * Generates a to-do list item store for the edited object with the provided `object_id`.
     * 
     * `items` can contain partially set values for items (`item_number` is still required for each item passed).
     * If omitted, a single item is generated.
     */
    toDoListItems(object_id: number, items?: ToDoListItemParams[]): ToDoListItems {
        items = items || [this.object.toDoListDataItem(object_id)]
        return items.reduce((result, customAttrs) => {
            const item = this.object.toDoListDataItem(object_id, customAttrs);
            const { item_number } = item;
            delete (item as Partial<ToDoListItemData>)["item_number"];
            result[item_number] = item;
            return result;
        }, {} as ToDoListItems);
    }

    /**
     * Generates a composite subobjects store for the edited object.
     * 
     * `subobjects` can contain partially set values for subobjects
     * (`subobject_id`, `column` & `row` are still required for each subobject passed).
     * If omitted, a single subobject is generated.
     */
    subobjects(subobjects?: CompositeSubobjectParams[]): CompositeSubobjects["subobjects"] {
        subobjects = subobjects || [this.object.compositeDataSubobject()];
        return subobjects.reduce((result, customAttrs) => {
            const { deleteMode = SubobjectDeleteMode.none, fetchError = "" } = customAttrs;
            const so = { ...this.object.compositeDataSubobject(customAttrs), deleteMode, fetchError };
            const { subobject_id } = so;
            delete (so as Partial<CompositeSubobjectData>)["subobject_id"];
            result[subobject_id] = so;
            return result;
        }, {} as CompositeSubobjects["subobjects"]);
    }
}
