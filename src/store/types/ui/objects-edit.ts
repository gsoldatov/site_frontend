import { z } from "zod";

import { int, nonNegativeInt, positiveIntArray } from "../../../util/types/common";


/** /objects/edit/:id page UI state schema. */
export const objectsEditUI = z.object({
    currentObjectID: int,

    tagsInput: z.object({
        isDisplayed: z.boolean(),
        inputText: z.string(),
        matchingIDs: positiveIntArray
    }),

    objectOnLoadFetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    }),
    
    objectOnSaveFetch: z.object({
        isFetching: z.boolean(),
        fetchError: z.string()
    }),

    selectedTab: nonNegativeInt,

    showResetDialog: z.boolean(),
    showDeleteDialog: z.boolean(),
    toDoListRerenderPending: z.boolean(),

    addCompositeSubobjectMenu: z.object({
        row: int,
        column: int,
        inputText: z.string(),
        matchingIDs: positiveIntArray
    })
});

/** /objects/edit/:id page UI state type. */
type ObjectsEditUI = z.infer<typeof objectsEditUI>;


/** Returns /objects/edit/:id state with default values being replaced `customValues`. */
export const getObjectsEditUI = (customValues: Partial<ObjectsEditUI> = {}) => objectsEditUI.parse({
        currentObjectID: -1,

        tagsInput: {
            isDisplayed: false,
            inputText: "",
            matchingIDs: []
        },

        objectOnLoadFetch: {
            isFetching: false,
            fetchError: ""
        },

        objectOnSaveFetch: {
            isFetching: false,
            fetchError: ""
        },

        selectedTab: 0,

        showResetDialog: false,
        showDeleteDialog: false,
        toDoListRerenderPending: false,

        addCompositeSubobjectMenu: {
            row: -1,
            column: -1,
            inputText: "",
            matchingIDs: []
        }

    ...customValues
});
