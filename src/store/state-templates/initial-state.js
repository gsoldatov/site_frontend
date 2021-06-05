const initialState = {
    redirectOnRender: "",

    // tags storage
    tags: {},

    // /tags/:id page UI controllers
    tagUI: {
        currentTag: {       // current state of the tag being added/edited
            tag_id: 0,
            tag_name: "",
            tag_description: "",
            created_at: "",
            modified_at: ""
        },

        tagOnLoadFetch: {
            isFetching: false,
            fetchError: ""
        },

        tagOnSaveFetch: {
            isFetching: false,
            fetchError: ""
        },

        showDeleteDialog: false
    },

    // /tags page UI controllers
    tagsUI: {
        paginationInfo: {
            currentPage: 1,
            itemsPerPage: 100,
            totalItems: 0,
            sortField: "tag_name",          // field name to sort the tags by (tag_name, modified_at)
            sortOrder: "asc",               // sort order (asc, desc)
            filterText: "",                 // text by which tags are filtered
            currentPageTagIDs: []
        },
        selectedTagIDs: [],
        showDeleteDialog: false,

        fetch: {
            isFetching: false,
            fetchError: ""
        }
    },

    // objects' tags storage
    objectsTags: {},

    // objects' storages
    objects: {},    // general arributes
    links: {},
    markdown: {},
    toDoLists: {},
    composite: {},

    // edited objects
    editedObjects: {},

    // /objects/:id page UI controllers
    objectUI: {
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

        addCompositeSubobjectMenu: {
            row: -1,
            column: -1,
            inputText: "",
            matchingIDs: []
        }
    },

    // /objects page UI controllers
    objectsUI: {
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
        }
    }
};

export default initialState;