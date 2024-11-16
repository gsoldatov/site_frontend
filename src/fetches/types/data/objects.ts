import { z } from "zod";

import { type FetchResult } from "../../fetch-runner";

import { object } from "../../../store/types/data/objects";
import { link } from "../../../store/types/data/links";
import { markdown } from "../../../store/types/data/markdown";
import { toDoList, toDoListItem } from "../../../store/types/data/to-do-list";
import { composite, compositeSubobject } from "../../../store/types/data/composite";
import { nonNegativeInt, int } from "../../../util/types/common";


const backendLink = link;
const backendMarkdown = markdown.pick({ raw_text: true });
const backendToDoListItem = toDoListItem.extend({ item_number: nonNegativeInt });
const backendToDoList = toDoList.pick({ sort_type: true }).extend({ items: backendToDoListItem.array() });
const backendCompositeSubobject = compositeSubobject.omit({ deleteMode: true, fetchError: true }).extend({ object_id: int });
const backendComposite = composite.omit({ subobjects: true }).extend({ subobjects: backendCompositeSubobject.array() });


/** Backend link object data type. */
export type BackendLink = z.infer<typeof backendLink>;
/** Backend markdown object data type. */
export type BackendMarkdown = z.infer<typeof backendMarkdown>;
/** Backend to-do list object data type. */
export type BackendToDoList = z.infer<typeof backendToDoList>;
/** Backend composite object data type. */
export type BackendComposite = z.infer<typeof backendComposite>;
/** Backend object data type. */
export type BackendObjectData = BackendLink | BackendMarkdown | BackendToDoList | BackendComposite;

/** Backend to-do list item type. */
export type BackendToDoListItem = z.infer<typeof backendToDoListItem>;
/** Backend composite subobject type. */
export type BackendCompositeSubobject = z.infer<typeof backendCompositeSubobject>;


/** /objects/view backend response schema for "object" list items. */
const objectsViewResponseObject = object.extend({ current_tag_ids: int.array() });

/** /objects/view backend response schema for "object_data" list items. */
const objectsViewResponseObjectData = z.intersection(
    z.object({ object_id: int }),
    z.discriminatedUnion("object_type", [
        z.object({ object_type: z.literal("link"), object_data: backendLink }),
        z.object({ object_type: z.literal("markdown"), object_data: backendMarkdown }),
        z.object({ object_type: z.literal("to_do_list"), object_data: backendToDoList }),
        z.object({ object_type: z.literal("composite"), object_data: backendComposite })
    ])
);


/** /objects/view response body schema. */
export const objectsViewResponseSchema = z.object({
    objects: objectsViewResponseObject.array(),
    object_data: objectsViewResponseObjectData.array()
});

type ObjectsViewResponseSchema = z.infer<typeof objectsViewResponseSchema>;
export type ObjectsViewFetchResult = FetchResult & Partial<ObjectsViewResponseSchema>;
