const initialState = {
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

        redirectOnRender: "",

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

        redirectOnRender: "",
        lastFetch: "",

        
        paginationFetch: {
            isFetching: false,
            fetchError: ""
        },

        onDeleteFetch: {
            isFetching: false,
            fetchError: ""
        }
    },

    // objects storages
    objects: {},    // general arributes
    links: {},

    // /objects/:id page UI controllers
    objectUI: {
        currentObject: {       // current state of the tag being added/edited
            object_id: 0,
            object_type: "url",
            object_name: "",
            object_description: "",
            created_at: "",
            modified_at: "",

            link: ""
        },

        redirectOnRender: "",

        objectOnLoadFetch: {
            isFetching: false,
            fetchError: ""
        },

        objectOnSaveFetch: {
            isFetching: false,
            fetchError: ""
        },

        showDeleteDialog: false
    },

    // /objects page UI controllers
    objectsUI: {
        selectedobjectIDs: []
    }
};

export default initialState;