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
type CurrentTag = z.infer<typeof currentTag>;


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

    tagOnLoadFetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    }),
    
    tagOnSaveFetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    }),
    
    showDeleteDialog: z.boolean()
});

/** /tags/edit/:id page UI state type. */
type TagsEditUI = z.infer<typeof tagsEditUI>;


/** Returns /tags/edit/:id state with default values being replaced `customValues`. */
export const getTagsEditUI = (customValues: Partial<TagsEditUI> = {}) => tagsEditUI.parse({
    currentTag: getCurrentTagState(),

    tagOnLoadFetch: {
        isFetching: false,
        fetchError: ""
    },

    tagOnSaveFetch: {
        isFetching: false,
        fetchError: ""
    },

    showDeleteDialog: false,

    ...customValues
});
