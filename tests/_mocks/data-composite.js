import { addObjectData, addObjects } from "../../src/actions/data-objects";
import { addTags, setObjectsTags } from "../../src/actions/data-tags";
import { resetEditedObjects } from "../../src/actions/objects-edit";
import { createTestStore } from "../_util/create-test-store";
import { generateObjectAttributes, defaultObjectAttributeValueGetters, generateObjectData } from "./data-objects";

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

            _cachedObjects[newID] = { 
                object_id: newID, 
                created_at: createdAt.toDateString(), 
                modified_at: modifiedAt.toDateString(),
                owner_id: subobject["owner_id"] || 1,
                tag_updates: { added_tag_ids: [] }
            };
            for (let attr of Object.keys(defaultObjectAttributeValueGetters))
                if (["current_tag_ids", "created_at", "modified_at", "owner_id"].indexOf(attr) === -1)
                    _cachedObjects[newID][attr] = subobject[attr];
            _cachedObjectData[newID] = subobject["object_data"];

            // _cachedObjects[newID] = { object_id: newID, object_type: subobject["object_type"], object_name: subobject["object_name"], object_description: subobject["object_description"], 
            //     created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString(), 
            //     is_published: subobject["is_published"], owner_id: subobject["owner_id"] || 1,
            //     tag_updates: { added_tag_ids: [] } };
            // _cachedObjectData[newID] = subobject["object_data"];
        }
    });
    return { id_mapping };
};


/**
 * Returns composite object data (without object id or type).
 * 
 * Accepts `object_id` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to composite object data structure are made.
 */
 export const generateCompositeObjectData = (object_id, overrideValues = {}) => {
    const defaultCompositeAttributeValueGetters = {
        subobjects: () => [
            generateCompositeSubobject(101, 0, 0)
        ],
        display_mode: () => "basic",
        numerate_chapters: () => false
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultCompositeAttributeValueGetters)) throw Error(`getCompositeObjectData received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = {};
    for (let attr of Object.keys(defaultCompositeAttributeValueGetters))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultCompositeAttributeValueGetters[attr](object_id);

    return result;
};


/**
 * Returns composite subobject object data (for the `subobjects` array of composite object data).
 * 
 * Accepts `object_id`, `column`, `row` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to composite subobject data structure are made.
 */
export const generateCompositeSubobject = (object_id, column, row, overrideValues = {}) => {
    const defaultSubobjectValues = {
        selected_tab: 0,
        is_expanded: true,
        show_description_composite: "inherit",
        show_description_as_link_composite: "inherit"
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultSubobjectValues)) throw Error(`getCompositeSubobject received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = { object_id, column, row };
    for (let attr of Object.keys(defaultSubobjectValues))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultSubobjectValues[attr];
    
    return result;
};


/**
 * Returns a Redux store with a composite object `1` and its subobjects (`2`, `3`) present in attribute, tag and data storages.
 */
export const getStoreWithCompositeObjectAndSubobjects = () => {
    let store = createTestStore({ enableDebugLogging: false });

    let objects = [
        generateObjectAttributes(1, { 
            object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString()
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            current_tag_ids: [] 
        }),
        generateObjectAttributes(3, {
            object_type: "markdown", object_name: "markdown subobject", object_description: "markdown subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
            current_tag_ids: [] 
        })
    ];
    let objectData = [
        generateObjectData(1, "composite", {
            subobjects: [
                generateCompositeSubobject(2, 0, 0),
                generateCompositeSubobject(3, 0, 1)
            ]            
        }),

        generateObjectData(2, "link", { "link": "https://test.link" }),
        generateObjectData(3, "markdown", { "raw_text": "**Test text**" })
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
        generateObjectAttributes(1, {
            object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
        })
    ];
    let objectData = [
        generateObjectData(1, "composite", {
            subobjects: [
                generateCompositeSubobject(2, 0, 0),
                generateCompositeSubobject(3, 0, 1)
            ]            
        })
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
        generateObjectAttributes(1, {
            object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), 
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(),
            current_tag_ids: [] 
        })
    ];
    let objectData = [
        generateObjectData(1, "composite", {
            subobjects: [
                generateCompositeSubobject(2, 0, 0),
                generateCompositeSubobject(-1, 0, 1)
            ]            
        }),

        generateObjectData(2, "link", { "link": "https://test.link" })
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
 * Returns a Redux store with a composite object with a single subobject of each type (and an additional subobject for ).
 * If `mainObjectIsNew` is set to true, main object is generated with id = 0.
 * If `subobjectsAreNew` is set to true, main object's subobjects are generated with negative object IDs (except for composite subobject).
 */
export const getStoreWithCompositeObjectAndSubobjectsOfEachType = (mainObjectIsNew, subobjectsAreNew) => {
    let store = createTestStore({ enableDebugLogging: false });

    const mainObjectID = mainObjectIsNew ? 0 : 3201;
    const linkSubobjectID = subobjectsAreNew ? -2 : 2;
    const markdownSubobjectID = subobjectsAreNew ? -3 : 3;
    const TDLSubobjectID = subobjectsAreNew ? -4 : 4;
    const compositeSubobjectID = 5;

    let objects = [
        generateObjectAttributes(mainObjectID, { object_type: "composite", object_name: "main composite object" }),
        generateObjectAttributes(linkSubobjectID, { object_type: "link", object_name: "link subobject" }),
        generateObjectAttributes(markdownSubobjectID, { object_type: "markdown", object_name: "markdown subobject" }),
        generateObjectAttributes(TDLSubobjectID, { object_type: "to_do_list", object_name: "to-do list subobject" }),
        generateObjectAttributes(compositeSubobjectID, { object_type: "composite", object_name: "composite subobject" }),
        generateObjectAttributes(6, { object_type: "link", object_name: "subobject of a composite subobject" })
    ];

    let objectData = [
        generateObjectData(mainObjectID, "composite", {
            subobjects: [
                generateCompositeSubobject(linkSubobjectID, 0, 0),
                generateCompositeSubobject(markdownSubobjectID, 0, 1),
                generateCompositeSubobject(TDLSubobjectID, 0, 2),
                generateCompositeSubobject(compositeSubobjectID, 0, 3)
            ]
        }),
        generateObjectData(linkSubobjectID, "link"),
        generateObjectData(markdownSubobjectID, "markdown"),
        generateObjectData(TDLSubobjectID, "to_do_list"),
        generateObjectData(compositeSubobjectID, "composite", {
            subobjects: [ generateCompositeSubobject(6, 0, 0) ]
        }),
        generateObjectData(6, "link")
    ];

    let tags = objects[0].current_tag_ids.map(tag_id => ({ tag_id, tag_name: `tag #${tag_id}`, tag_description: `tag description #${tag_id}`,
                created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() }));

    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(addObjectData(objectData));
    store.dispatch(resetEditedObjects({objectIDs: [mainObjectID, linkSubobjectID, markdownSubobjectID, TDLSubobjectID, compositeSubobjectID, 6], allowResetToDefaults: true }));
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
 * If `overrideValues` is passed and default object data is returned, the returned attribute value are overriden with provided via this param.
*/
export const getCompositeByObjectID = (objectID, overrideValues) => {
    const strID = objectID.toString();
    switch (strID) {
        case "3901": return compositeWithAllSubobjectTypes;
        case "3902": return compositeWithoutSubobjects;
        case "3903": return compositeWithCollapsedAndExpandedCards;
        case "3904": return compositeWithAnUnavailableSubobject;
        case "3905": return compositeWithTwoColumns;
        case "3906": return compositeWithFourColumns;
        default: return generateCompositeObjectData(objectID, overrideValues);     // a single link subobject
    }
};


/*
    link
    markdown
    to_do_list
    composite
*/
const compositeWithAllSubobjectTypes = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(101, 0, 0),
        generateCompositeSubobject(1101, 0, 1),
        generateCompositeSubobject(2101, 0, 2),
        generateCompositeSubobject(3101, 0, 3)
    ]
});

/*
    <no subobjects>
*/
const compositeWithoutSubobjects = generateCompositeObjectData(undefined, {
    subobjects: []
});

/*
    <collapsed>
    <collapsed>
    <expanded>
    <expanded>
*/
const compositeWithCollapsedAndExpandedCards = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(101, 0, 0, { is_expanded: false }),
        generateCompositeSubobject(1101, 0, 1, { is_expanded: false }),
        generateCompositeSubobject(2101, 0, 2, { is_expanded: true }),
        generateCompositeSubobject(3101, 0, 3, { is_expanded: true })
    ]
});


/*
    <unavailable>
    <available>
    <available>
*/
const compositeWithAnUnavailableSubobject = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(9999, 0, 0, { is_expanded: false }),
        generateCompositeSubobject(1101, 0, 1, { is_expanded: true }),
        generateCompositeSubobject(2101, 0, 2, { is_expanded: true })
    ]
});


/*
    link    link
    link    link
    link    link
    link    link
*/
const compositeWithTwoColumns = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(101, 0, 0),
        generateCompositeSubobject(102, 0, 1),
        generateCompositeSubobject(103, 0, 2),
        generateCompositeSubobject(104, 0, 3),

        generateCompositeSubobject(105, 1, 0),
        generateCompositeSubobject(106, 1, 1),
        generateCompositeSubobject(107, 1, 2),
        generateCompositeSubobject(108, 1, 3)
    ]
});


/*
    link    link    link    link
    link            link
*/
const compositeWithFourColumns = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(101, 0, 0),
        generateCompositeSubobject(102, 0, 1),

        generateCompositeSubobject(103, 1, 0),

        generateCompositeSubobject(104, 2, 0),
        generateCompositeSubobject(105, 2, 1),

        generateCompositeSubobject(106, 3, 0)
    ]
});
