import { z } from "zod";
import { int, nonNegativeInt, nonNegativeIntArray, nonNegativeIntIndex, positiveInt } from "../../../util/types/common";


/** To-do list item's schema for state.toDoLists & state.editedObjects. */
const toDoListItem = z.object({
    item_state: z.enum(["active", "optional", "completed", "cancelled"]),
    item_text: z.string(),
    commentary: z.string(),
    indent: nonNegativeInt.max(5),
    is_expanded: z.boolean()
});


/** To-do list data schema in state.toDoLists & state.editedObjects. */
export const toDoList = z.object({
    sort_type: z.enum(["default", "state"]),
    items: z.record(nonNegativeIntIndex, toDoListItem),

    itemOrder: nonNegativeIntArray,
    setFocusOnID: int,
    caretPositionOnFocus: int,
    newItemInputIndent: nonNegativeInt.max(5),
    draggedParent: int,
    draggedChildren: nonNegativeIntArray,
    draggedOver: int,
    dropIndent: nonNegativeInt.max(5)
});


/** state.toDoLists data store schema. */
export const toDoLists = z.record(positiveInt, toDoList);


/** Returns default to-do list item state. */
export const getDefaultToDoListItem = () => toDoListItem.parse({
    item_state: "active", 
    item_text: "", 
    commentary: "", 
    indent: 0, 
    is_expanded: true
});


/** To-do list object's data type for state.toDoLists & state.editedObjects. */
export type ToDoList = z.infer<typeof toDoList>;
