import { addObjectData, addObjects } from "../../src/actions/data-objects";
import { setObjectsTags } from "../../src/actions/data-tags";
import { resetEditedObjects } from "../../src/actions/object";
import createStore from "../../src/store/create-store";
import { enumDeleteModes } from "../../src/store/state-templates/composite-subobjects";

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
                created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString(), tag_updates: { added_tag_ids: [] } };
            _cachedObjectData[newID] = subobject["object_data"];
        }
    });
    return { id_mapping };
};


/**
 * Returns a Redux store with a composite object `1` and its subobjects (`2`, `3`) present in attribute, tag and data storages.
 */
export const getStoreWithCompositeObjectAndSubobjects = () => {
    let store = createStore({ enableDebugLogging: false });
    let objects = [
        { 
            object_id: 1, object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        },
        { 
            object_id: 2, object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [] 
        },
        { 
            object_id: 3, object_type: "markdown", object_name: "markdown subobject", object_description: "markdown subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [] 
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
    let store = createStore({ enableDebugLogging: false });
    let objects = [
        { 
            object_id: 1, object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        }
    ];
    let objectData = [
        { object_id: 1, object_type: "composite", object_data: { subobjects: [
            { object_id: 2, row: 0, column: 0, selected_tab: 0, is_expanded: true },
            { object_id: 3, row: 1, column: 0, selected_tab: 0, is_expanded: true }
        ]}}
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(addObjectData(objectData));

    return store;
 };


 /**
  * Returns a Redux store with a composite object `1` and its subobjects (`2`, `-1`) present in storages and editedObjects.
  */
export const getStoreWithModifiedCompositeObject = () => {
    let store = createStore({ enableDebugLogging: false });

    let objects = [
        { 
            object_id: 1, object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        },
        { 
            object_id: 2, object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [] 
        }
    ];
    let objectData = [
        { object_id: 1, object_type: "composite", object_data: { subobjects: [
            { object_id: 2, row: 0, column: 0, selected_tab: 0, is_expanded: true },
            { object_id: -1, row: 1, column: 0, selected_tab: 0, is_expanded: true }
        ]}},
        { object_id: 2, object_type: "link", object_data: {"link": "https://test.link"} }
    ];

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(addObjectData(objectData));
    store.dispatch(resetEditedObjects({objectIDs: [1, 2, -1], allowResetToDefaults: true }));

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