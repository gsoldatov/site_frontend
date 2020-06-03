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

        addTagFetch: {
            isFetching: false,
            fetchError: ""
        },

        editTagFetch: {
            isFetching: false,
            fetchError: "",
            fetchType: ""
        }
    },

    // tags page UI controllers
    tagsUI: {
        selected: [],           // list of selected tags
        filterText: "",         // filter tags by name
        sortBy: "tag_name",     // created_at, tag_name
        sortAsc: true,          // sort order
        /* 
            tags page menu actions (all enabled actions are present in the list):
            - create tag (always available);
            - edit (1 selected);
            - delete (1+ selected);

            - merge (2+ selected);
            - add synonims (2+ selected);       // todo separate menu/page for editing synonims
            - add autotags (2+ selected);       // todo separate menu/page
            - remove synonims/autotags (2+ selected);        // todo separate menu/page

            tag page:
            - save
            - exit

        */
        menuActions: [],
        paginationInfo: {
            currentPage: 1,
            lastPage: 20,
            itemsPerPage: 100,
            currentPageItems: []
        }
    },
    // TODO
    objects: [], // list of loaded objects
    objectsUI: {       
        selected: [],       // selected objects
        sortBy: "created_at",       // created_at, modified_at, object_type, object_name
        sortAsc: false,             // sort order
        
    }
};

export default initialState;