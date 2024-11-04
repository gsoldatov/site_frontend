import { z } from "zod";

import { nonNegativeInt, positiveInt, positiveIntArray, timestampOrEmptyString } from "../../../util/types/common";


/** /tags/list page UI state schema. */
export const tagsListUI = z.object({
    paginationInfo: z.object({
        currentPage: positiveInt,
        itemsPerPage: positiveInt,
        totalItems: nonNegativeInt,
        sortField: z.enum(["tag_name", "modified_at"]),
        sortOrder: z.enum(["asc", "desc"]),
        filterText: z.string(),
        currentPageTagIDs: positiveIntArray
    }),
    selectedTagIDs: positiveIntArray,
    showDeleteDialog: z.boolean(),

    fetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    })
});


/** /tags/list page UI state type. */
type TagsListUI = z.infer<typeof tagsListUI>;


/** Returns /tags/liststate with default values being replaced `customValues`. */
export const getTagsListUI = (customValues: Partial<TagsListUI> = {}) => tagsListUI.parse({
    paginationInfo: {
        currentPage: 1,
        itemsPerPage: 100,
        totalItems: 0,
        sortField: "tag_name",
        sortOrder: "asc",
        filterText: "",
        currentPageTagIDs: []
    },
    selectedTagIDs: [],
    showDeleteDialog: false,

    fetch: {
        isFetching: false,
        fetchError: ""
    },

    ...customValues
});
