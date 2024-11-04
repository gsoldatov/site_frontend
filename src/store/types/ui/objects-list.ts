import { z } from "zod";

import { nonNegativeInt, positiveInt, positiveIntArray } from "../../../util/types/common";
import { objectTypes } from "../data/objects";


/** /objects/list page UI state schema. */
export const objectsListUI = z.object({
    paginationInfo: z.object({
        currentPage: positiveInt,
        itemsPerPage: positiveInt,
        totalItems: nonNegativeInt,
        sortField: z.enum(["object_name", "modified_at"]),
        sortOrder: z.enum(["asc", "desc"]),
        filterText: z.string(),
        objectTypes,
        tagsFilter: positiveInt,
        currentPageObjectIDs: positiveIntArray
    }),
    selectedObjectIDs: positiveIntArray,
    showDeleteDialog: z.boolean(),

    addedTags: positiveInt.or(z.string().min(1)).array(),
    removedTagIDs: positiveIntArray,
    tagsInput: z.object({
        isDisplayed: z.boolean(),
        inputText: z.string(),
        matchingIDs: positiveIntArray
    }),

    tagsFilterInput: z.object({
        inputText: z.string(),
        matchingIDs: positiveIntArray
    }),

    fetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    })
});


/** /objects/list page UI state type. */
type ObjectsListUI = z.infer<typeof objectsListUI>;


/** Returns /objects/list state with default values being replaced `customValues`. */
export const getObjectsListUI = (customValues: Partial<ObjectsListUI> = {}) => objectsListUI.parse({
    paginationInfo: {
        currentPage: 1,
        itemsPerPage: 100,
        totalItems: 0,
        sortField: "object_name",       // field name to sort the objects by (object_name, modified_at)
        sortOrder: "asc",               // sort order (asc, desc)
        filterText: "",                 // text by which objects are filtered
        objectTypes: [],
        tagsFilter: [],
        currentPageObjectIDs: []
    },
    selectedObjectIDs: [],
    showDeleteDialog: false,

    addedTags: [],
    removedTagIDs: [],
    tagsInput: {
        isDisplayed: false,
        inputText: "",
        matchingIDs: []
    },

    tagsFilterInput: {
        inputText: "",
        matchingIDs: []
    },

    fetch: {
        isFetching: false,
        fetchError: ""
    },

    ...customValues
});
