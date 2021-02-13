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

    // objects storages
    objects: {},    // general arributes
    links: {},
    markdown: {},
    toDoLists: {},

    // /objects/:id page UI controllers
    objectUI: {
        currentObject: {       // current state of the tag being added/edited
            object_id: 0,
            object_type: "url",
            object_name: "",
            object_description: "",
            created_at: "",
            modified_at: "",

            currentTagIDs: [],   // object's tags state
            addedTags: [],
            removedTagIDs: [],
            tagsInput: {
                isDisplayed: false,
                inputText: "",
                matchingIDs: []
            },

            link: "",
            markdown: { 
                raw_text: "", 
                parsed: "" 
            },
            toDoList: {
                itemOrder: [],
                setFocusOnID: -1,
                caretPositionOnFocus: -1,
                newItemInputIndent: 0,

                sort_type: "default",
                items: {}
            }
        },

        saveAddObjectState: false,

        markdownDisplayMode: "both",

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