import { z } from "zod";

import { auth, getDefaultAuthState } from "./data/auth";
import { users } from "./data/users";
import { tags } from "./data/tags";
import { objects } from "./data/objects";
import { objectsTags } from "./data/objects-tags";
import { links } from "./data/links";
import { markdownStore } from "./data/markdown";
import { toDoLists } from "./data/to-do-list";
import { compositeStore } from "./data/composite";
import { editedObjects } from "./data/edited-objects";
import { modalUI, getModalUIState } from "./ui/modal";
import { navigationUI } from "./ui/navigation";
import { tagsListUI, getTagsListUI } from "./ui/tags-list";
import { tagsEditUI, getTagsEditUI } from "./ui/tags-edit";
import { objectsEditedUI } from "./ui/objects-edited";
import { objectsListUI, getObjectsListUI } from "./ui/objects-list";
import { objectsEditUI, getObjectsEditUI } from "./ui/objects-edit";


const state = z.object({
    // Data stores
    auth,
    users,
    tags,
    objects,
    objectsTags,
    links,
    markdown: markdownStore,
    toDoLists,
    composite: compositeStore,
    editedObjects,

    // UI, common
    redirectOnRender: z.string(),
    modalUI,
    navigationUI,

    // UI, pages
    tagsListUI,
    tagsEditUI,
    objectsEditedUI,
    objectsListUI,
    objectsEditUI
});


/** App's state type. */
export type State = z.infer<typeof state>;


/** Returns a copy of app's initial state */
export const getInitialState = () => state.parse({
    // Data stores, auth & users
    auth: getDefaultAuthState(),    // current user's auth data
    users: {},
    
    // Data store, tags
    tags: {},

    // Data stores, objects
    objects: {},    // objects' attributes
    objectsTags: {},    // objects' tags
    links: {},
    markdown: {},
    toDoLists: {},
    composite: {},

    // Data store, edited objects
    editedObjects: {},

    // UI, common
    redirectOnRender: "",
    modalUI: getModalUIState(),             // modal window state
    
    navigationUI: {             // navbar state
        isFetching: false
    },

    // UI, pages
    tagsListUI: getTagsListUI(),
    tagsEditUI: getTagsEditUI(),
    objectsEditedUI: {
        selectedObjectIDs: new Set()
    },
    objectsListUI: getObjectsListUI(),
    objectsEditUI: getObjectsEditUI()
});
