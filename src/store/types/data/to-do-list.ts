import { z } from "zod";
import { int, nonNegativeInt, nonNegativeIntArray, nonNegativeIntIndex, positiveInt } from "../../../util/types/common";


/** A single to-do list item in state.toDoLists & state.editedObjects schema. */
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


/** To-do list objects' data store schema. */
export const toDoLists = z.record(positiveInt, toDoList);


/** Returns default to-do list item state. */
export const getDefaultToDoListItem = () => toDoListItem.parse({
    item_state: "active", 
    item_text: "", 
    commentary: "", 
    indent: 0, 
    is_expanded: true
});
