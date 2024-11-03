import { z } from "zod";
import { int, nonNegativeInt, nonNegativeIntArray, positiveInt } from "../../../util/types/common";


const toDoListItem = z.object({
    item_state: z.enum(["active", "optional", "completed", "cancelled"]),
    item_text: z.string(),
    commentary: z.string(),
    indent: nonNegativeInt.max(5),
    is_expanded: z.boolean()
});


const toDoList = z.object({
    sort_type: z.enum(["default", "state"]),
    items: z.record(nonNegativeInt, toDoListItem),

    itemOrder: nonNegativeIntArray,
    setFocusOnID: int,
    caretPositionOnFocus: int,
    newItemInputIndent: nonNegativeInt.max(5),
    draggedParent: int,
    draggedChildren: nonNegativeIntArray,
    draggedOver: int,
    dropIndent: nonNegativeInt.max(5)
});


export const toDoLists = z.record(positiveInt, toDoList);

export const getDefaultToDoListItem = () => toDoListItem.parse({
    item_state: "active", 
    item_text: "", 
    commentary: "", 
    indent: 0, 
    is_expanded: true
});
