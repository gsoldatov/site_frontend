import { addObjectData, addObjects } from "../../src/actions/data-objects";
import { addTags, setObjectsTags } from "../../src/actions/data-tags";
import { resetEditedObjects } from "../../src/actions/objects-edit";
import { createTestStore } from "../_util/create-test-store";

import { _cachedObjects, _cachedObjectData } from "./mock-fetch-handlers-objects";


/**
 * Returns id mapping for added/updated composite object in a format returned by backend.
 */
export const mapAndCacheNewSubobjects = (requestObjectData, createdAt, modifiedAt) => {
    const id_mapping = {};
    requestObjectData.subobjects.forEach(subobject => {
        if (subobject.object_id < 0 && subobject.object_type !== undefined) {
            let newID = getMappedSubobjectID(subobject.object_id, subobject.object_type);
            if (newID === undefined) throw Error (`Received an unexpected object_type "${subobject.object_type}" when mapping subobject id ${subobject.object_id}`);
            id_mapping[subobject.object_id] = newID;

            _cachedObjects[newID] = { object_id: newID, object_type: subobject["object_type"], object_name: subobject["object_name"], object_description: subobject["object_description"], 
                created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString(), 
                is_published: subobject["is_published"], owner_id: subobject["owner_id"] || 1,
                tag_updates: { added_tag_ids: [] } };
            _cachedObjectData[newID] = subobject["object_data"];
        }
    });
    return { id_mapping };
};


/**
 * Returns a Redux store with a composite object `1` and its subobjects (`2`, `3`) present in attribute, tag and data storages.
 */
export const getStoreWithCompositeObjectAndSubobjects = () => {
    let store = createTestStore({ enableDebugLogging: false });
    let objects = [
        { 
            object_id: 1, object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1,
            current_tag_ids: [1, 2, 3, 4, 5] 
        },
        { 
            object_id: 2, object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1,
            current_tag_ids: [] 
        },
        { 
            object_id: 3, object_type: "markdown", object_name: "markdown subobject", object_description: "markdown subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1,
            current_tag_ids: [] 
        }
    ];
    let objectData = [
        { object_id: 1, object_type: "composite", object_data: { subobjects: [
            { object_id: 2, row: 0, column: 0, selected_tab: 0, is_expanded: true },
            { object_id: 3, row: 1, column: 0, selected_tab: 0, is_expanded: true }
        ]}},
        { object_id: 2, object_type: "link", object_data: {"link": "https://test.link"} },
        { object_id: 3, object_type: "markdown", object_data: {"raw_text": "**Test text**"} }
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(addObjectData(objectData));

    return store;
};


/**
 * Returns a Redux store with a composite object `1` (but not its subobjects) present in attribute, tag and data storages.
 */
 export const getStoreWithCompositeObject = () => {
    let store = createTestStore({ enableDebugLogging: false });
    let objects = [
        { 
            object_id: 1, object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1,
            current_tag_ids: [1, 2, 3, 4, 5] 
        }
    ];
    let objectData = [
        { object_id: 1, object_type: "composite", object_data: { subobjects: [
            { object_id: 2, row: 0, column: 0, selected_tab: 0, is_expanded: true },
            { object_id: 3, row: 1, column: 0, selected_tab: 0, is_expanded: true }
        ]}}
    ];
    let tags = objects[0].current_tag_ids.map(tag_id => ({ tag_id, tag_name: `tag #${tag_id}`, tag_description: `tag description #${tag_id}`,
                created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() }));

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(addObjectData(objectData));
    store.dispatch(addTags(tags));

    return store;
 };


 /**
  * Returns a Redux store with a composite object `1` and its subobjects (`2`, `-1`) present in storages and editedObjects.
  */
export const getStoreWithModifiedCompositeObject = () => {
    let store = createTestStore({ enableDebugLogging: false });

    let objects = [
        { 
            object_id: 1, object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1,
            current_tag_ids: [1, 2, 3, 4, 5] 
        },
        { 
            object_id: 2, object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            is_published: false, owner_id: 1,
            current_tag_ids: [] 
        }
    ];
    let objectData = [
        { object_id: 1, object_type: "composite", object_data: { subobjects: [
            { object_id: 2, row: 0, column: 0, selected_tab: 0, is_expanded: true },
            { object_id: -1, row: 1, column: 0, selected_tab: 0, is_expanded: true }
        ]}},
        { object_id: 2, object_type: "link", object_data: {"link": "https://test.link"} }
    ];
    let tags = objects[0].current_tag_ids.map(tag_id => ({ tag_id, tag_name: `tag #${tag_id}`, tag_description: `tag description #${tag_id}`,
                created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() }));

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(addObjectData(objectData));
    store.dispatch(resetEditedObjects({objectIDs: [1, 2, -1], allowResetToDefaults: true }));
    store.dispatch(addTags(tags));

    return store;
};


/**
 * Returns mapped id for a `subobjectID` based on its `objectType`.
 */
export const getMappedSubobjectID = (subobjectID, subobjectType) => {
    return subobjectType === "link" ? -1 * subobjectID + 800
    : subobjectType === "markdown" ? -1 * subobjectID + 1800
    : subobjectType === "to_do_list" ? -1 * subobjectID + 2800
    : undefined;
};


/**
 * Returns a mock to-do list object data based on the provided `objectID`.
*/
export const getCompositeByObjectID = objectID => {
    const strID = objectID.toString();
    switch (strID) {
        case "3901": return compositeWithAllSubobjectTypes;
        case "3902": return compositeWithoutSubobjects;
        case "3903": return compositeWithCollapsedAndExpandedCards;
        case "3904": return compositeWithAnUnavailableSubobject;
        case "3905": return compositeWithTwoColumns;
        case "3906": return compositeWithFourColumns;
        default: return defaultComposite;
    }
};


/*
    link
*/
const defaultComposite = {
    subobjects: [
        { object_id: 101, row: 0, column: 0, selected_tab: 0, is_expanded: true }
    ]
};

/*
    link
    markdown
    to_do_list
    composite
*/
const compositeWithAllSubobjectTypes = {
    subobjects: [
        { object_id: 101, row: 0, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 1101, row: 1, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 2101, row: 2, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 3101, row: 3, column: 0, selected_tab: 0, is_expanded: true }
    ]
};

/*
    <no subobjects>
*/
const compositeWithoutSubobjects = {
    subobjects: []
};


/*
    <collapsed>
    <collapsed>
    <expanded>
    <expanded>
*/
const compositeWithCollapsedAndExpandedCards = {
    subobjects: [
        { object_id: 101, row: 0, column: 0, selected_tab: 0, is_expanded: false },
        { object_id: 1101, row: 1, column: 0, selected_tab: 0, is_expanded: false },
        { object_id: 2101, row: 2, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 3101, row: 3, column: 0, selected_tab: 0, is_expanded: true }
    ]    
};


/*
    <unavailable>
    <available>
    <available>
*/
const compositeWithAnUnavailableSubobject = {
    subobjects: [
        { object_id: 9999, row: 0, column: 0, selected_tab: 0, is_expanded: false },
        { object_id: 1101, row: 1, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 2101, row: 2, column: 0, selected_tab: 0, is_expanded: true }
    ]    
};


/*
    link    link
    link    link
    link    link
    link    link
*/
const compositeWithTwoColumns = {
    subobjects: [
        { object_id: 101, row: 0, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 102, row: 1, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 103, row: 2, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 104, row: 3, column: 0, selected_tab: 0, is_expanded: true },

        { object_id: 105, row: 0, column: 1, selected_tab: 0, is_expanded: true },
        { object_id: 106, row: 1, column: 1, selected_tab: 0, is_expanded: true },
        { object_id: 107, row: 2, column: 1, selected_tab: 0, is_expanded: true },
        { object_id: 108, row: 3, column: 1, selected_tab: 0, is_expanded: true }
    ]
};


/*
    link    link    link    link
    link            link
*/
const compositeWithFourColumns = {
    subobjects: [
        { object_id: 101, row: 0, column: 0, selected_tab: 0, is_expanded: true },
        { object_id: 102, row: 1, column: 0, selected_tab: 0, is_expanded: true },
        
        { object_id: 103, row: 0, column: 1, selected_tab: 0, is_expanded: true },
        
        { object_id: 104, row: 0, column: 2, selected_tab: 0, is_expanded: true },
        { object_id: 105, row: 1, column: 2, selected_tab: 0, is_expanded: true },
        
        { object_id: 106, row: 0, column: 3, selected_tab: 0, is_expanded: true }
    ]
};