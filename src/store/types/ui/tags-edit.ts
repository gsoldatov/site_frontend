import { z } from "zod";

import { int, timestampOrEmptyString } from "../../../util/types/common";


/** Edited tag's state schema. */
export const currentTag = z.object({
    tag_id: int,
    tag_name: z.string(),
    tag_description: z.string(),
    is_published: z.boolean(),
    created_at: timestampOrEmptyString,
    modified_at: timestampOrEmptyString
});

/** Edited tag's type. */
export type CurrentTag = z.infer<typeof currentTag>;


/** Returns the state of an edited tag with default values being replaced `customValues`. */
export const getCurrentTagState = (customValues: Partial<CurrentTag> = {}) => currentTag.parse({
    tag_id: 0,
    tag_name: "",
    tag_description: "",
    is_published: true,
    created_at: "",
    modified_at: "",
    
    ...customValues
});


/** /tags/edit/:id page UI state schema. */
export const tagsEditUI = z.object({
    currentTag,

    loadFetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    }),
    
    saveFetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    }),
    
    showDeleteDialog: z.boolean()
});

/** /tags/edit/:id page UI state type. */
type TagsEditUI = z.infer<typeof tagsEditUI>;
/** /tags/edit/:id on load fetch state type. */
export type TagsEditLoadFetch = z.infer<typeof tagsEditUI.shape.loadFetch>;
/** /tags/edit/:id on save fetch state type. */
export type TagsEditSaveFetch = z.infer<typeof tagsEditUI.shape.saveFetch>;


/** Returns /tags/edit/:id state with default values being replaced `customValues`. */
export const getTagsEditUI = (customValues: Partial<TagsEditUI> = {}) => tagsEditUI.parse({
    currentTag: getCurrentTagState(),

    loadFetch: {
        isFetching: false,
        fetchError: ""
    },

    saveFetch: {
        isFetching: false,
        fetchError: ""
    },

    showDeleteDialog: false,

    ...customValues
});
