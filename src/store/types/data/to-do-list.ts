import { z } from "zod";
import { int, nonNegativeInt, nonNegativeIntArray, nonNegativeIntIndex, positiveInt } from "../../../util/types/common";


/** To-do list item's schema for state.toDoLists & state.editedObjects. */
export const toDoListItem = z.object({
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
    setFocusOnID: int.or(z.literal("newItem")),
    caretPositionOnFocus: int,
    newItemInputIndent: nonNegativeInt.max(5),
    draggedParent: int,
    draggedChildren: nonNegativeIntArray,
    draggedOver: int,
    dropIndent: nonNegativeInt.max(5)
});


export const toDoListItemState = toDoListItem.shape.item_state.options;
/** state.toDoLists data store schema. */
export const toDoLists = z.record(positiveInt, toDoList);

/** To-do list item type for state.toDoLists & state.editedObjects. */
export type ToDoListItem = z.infer<typeof toDoListItem>;
/** To-do list item state type. */
export type ToDoListItemState = z.infer<typeof toDoListItem.shape.item_state>;

/** To-do list object's data type for state.toDoLists & state.editedObjects. */
export type ToDoList = z.infer<typeof toDoList>;
/** To-do list item number or "newItem" constant type. */
export type ToDoListNewOrExistingItemNumber = z.infer<typeof toDoList.shape.setFocusOnID>;

/** state.toDoLists data store type. */
export type ToDoLists = z.infer<typeof toDoLists>;


/** Returns default to-do list item state with default or optional `customValues` set into it. */
export const getToDoListItem = (customValues: Partial<ToDoListItem> = {}): ToDoListItem => toDoListItem.parse({
    item_state: "active", 
    item_text: "", 
    commentary: "", 
    indent: 0, 
    is_expanded: true,
    
    ...customValues
});


/** Returns a to-do list object data with default or optional `customValues` set into it. */
export const getToDoList = (customValues: Partial<ToDoList> = {}): ToDoList => toDoList.parse({
    itemOrder: [],
    setFocusOnID: -1,
    caretPositionOnFocus: -1,
    newItemInputIndent: 0,
    draggedParent: -1,
    draggedChildren: [],
    draggedOver: -1,
    dropIndent: 0,

    sort_type: "default",
    items: {},

    ...customValues
});
