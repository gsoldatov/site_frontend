const initialState = {
    // tags storage
    tags: {},

    // tag page UI controllers
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

    // tags page UI controllers
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

    objects: [], // list of loaded objects
    objectsUI: {       
        selected: [],       // selected objects
        sortBy: "created_at",       // created_at, modified_at, object_type, object_name
        sortAsc: false,             // sort order
        
    }
};

export default initialState;