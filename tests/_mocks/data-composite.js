import { addObjectsAttributes, addObjectsDataFromBackend } from "../../src/reducers/data/objects";
import { addTags } from "../../src/reducers/data/tags";
import { addObjectsTags } from "../../src/reducers/data/objects-tags";
import { addEditedObjects, loadEditedObjects } from "../../src/reducers/data/edited-objects";
import { getEditedObjectState } from "../../src/types/store/data/edited-objects";
import { createTestStore } from "../_util/create-test-store";
import { generateObjectAttributes, defaultObjectAttributeValueGetters, generateObjectData } from "./data-objects";

import { _cachedObjects, _cachedObjectData } from "./mock-fetch-handlers-objects";
import { ObjectsTransformers } from "../../src/store/transformers/data/objects";


/**
 * Returns id mapping for added/updated composite object in a format returned by backend.
 */
export const mapAndCacheNewSubobjects = (requestObjectData, createdAt, modifiedAt) => {
    const id_mapping = {};
    requestObjectData.subobjects.forEach(subobject => {
        if (subobject.subobject_id < 0 && subobject.object_type !== undefined) {
            let newID = getMappedSubobjectID(subobject.subobject_id, subobject.object_type);
            if (newID === undefined) throw Error (`Received an unexpected object_type "${subobject.object_type}" when mapping subobject id ${subobject.subobject_id}`);
            id_mapping[subobject.subobject_id] = newID;

            _cachedObjects[newID] = { 
                object_id: newID, 
                created_at: createdAt.toISOString(), 
                modified_at: modifiedAt.toISOString(),
                owner_id: subobject["owner_id"] || 1,
                tag_updates: { added_tag_ids: [] }
            };
            for (let attr of Object.keys(defaultObjectAttributeValueGetters))
                if (["current_tag_ids", "created_at", "modified_at", "owner_id"].indexOf(attr) === -1)
                    _cachedObjects[newID][attr] = subobject[attr];
            _cachedObjectData[newID] = subobject["object_data"];

            // _cachedObjects[newID] = { object_id: newID, object_type: subobject["object_type"], object_name: subobject["object_name"], object_description: subobject["object_description"], 
            //     created_at: createdAt.toISOString(), modified_at: modifiedAt.toISOString(), 
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
 * Accepts `subobject_id`, `column`, `row` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to composite subobject data structure are made.
 */
export const generateCompositeSubobject = (subobject_id, column, row, overrideValues = {}) => {
    const defaultSubobjectValues = {
        selected_tab: 0,
        is_expanded: true,
        show_description_composite: "inherit",
        show_description_as_link_composite: "inherit"
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultSubobjectValues)) throw Error(`getCompositeSubobject received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = { subobject_id, column, row };
    for (let attr of Object.keys(defaultSubobjectValues))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultSubobjectValues[attr];
    
    return result;
};


/**
 * Returns a Redux store with a composite object `1` and its subobjects (`2`, `3`) present in attribute, tag and data storages.
 */
export const getStoreWithCompositeObjectAndSubobjects = () => {
    let { store } = createTestStore();

    let objects = [
        generateObjectAttributes(1, { 
            object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString()
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), 
            current_tag_ids: [] 
        }),
        generateObjectAttributes(3, {
            object_type: "markdown", object_name: "markdown subobject", object_description: "markdown subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), 
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

    store.dispatch(addObjectsAttributes(objects));
    store.dispatch(addObjectsTags(objects));
    store.dispatch(addObjectsDataFromBackend(objectData));

    return store;
};


/**
 * Returns a Redux store with a composite object `1` (but not its subobjects) present in attribute, tag and data storages.
 */
 export const getStoreWithCompositeObject = () => {
    let { store } = createTestStore();
    let objects = [
        generateObjectAttributes(1, {
            object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), 
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
                created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString() }));

    store.dispatch(addObjectsAttributes(objects));
    store.dispatch(addObjectsTags(objects));
    store.dispatch(addObjectsDataFromBackend(objectData));
    store.dispatch(addTags(tags));

    return store;
 };


 /**
  * Returns a Redux store with a composite object `1` and its subobjects (`2`, `-1`) present in storages and editedObjects.
  */
export const getStoreWithModifiedCompositeObject = () => {
    let { store } = createTestStore();

    let objects = [
        generateObjectAttributes(1, {
            object_type: "composite", object_name: "composite object", object_description: "composite subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), 
        }),
        generateObjectAttributes(2, {
            object_type: "link", object_name: "link subobject", object_description: "link subobject description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(),
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
                created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString() }));

    store.dispatch(addObjectsAttributes(objects));
    store.dispatch(addObjectsTags(objects));
    store.dispatch(addObjectsDataFromBackend(objectData));
    store.dispatch(loadEditedObjects([1, 2, -1]));
    store.dispatch(addTags(tags));

    return store;
};


/**
 * Returns a Redux store with a composite object with a single subobject of each type (and an additional subobject for ).
 * If `mainObjectIsNew` is set to true, main object is generated with id = 0.
 * If `subobjectsAreNew` is set to true, main object's subobjects are generated with negative object IDs (except for composite subobject).
 */
export const getStoreWithCompositeObjectAndSubobjectsOfEachType = (mainObjectIsNew, subobjectsAreNew) => {
    let { store } = createTestStore();

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
                created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString() }));

    // Add existing objects to state storages
    store.dispatch(addObjectsAttributes(objects.filter(o => o.object_id > 0)));
    store.dispatch(addObjectsTags(objects));
    store.dispatch(addObjectsDataFromBackend(objectData));

    // Add new & existing objects to edited objects
    for (let objectID of [mainObjectID, linkSubobjectID, markdownSubobjectID, TDLSubobjectID, compositeSubobjectID, 6]) {
        const attributes = objects.filter(o => o.object_id === objectID)[0];
        const { object_data } = objectData.filter(o => o.object_id === objectID)[0];
        const editedObjectData = ObjectsTransformers.backendDataToEdited(object_data);
        const editedObject = getEditedObjectState({ ...attributes, ...editedObjectData });
        store.dispatch(addEditedObjects([editedObject]));
    }

    // Add tags
    store.dispatch(addTags(tags));

    return store;
};


/**
 * Returns mapped id for a `subobjectID` based on its `objectType`.
 */
export const getMappedSubobjectID = (subobjectID, subobjectType) => {
    // NOTE: reimplemented to match /objects/bulk_upsert mock request handler logic
    return 1000 + -1 * subobjectID;
    
    // return subobjectType === "link" ? -1 * subobjectID + 800
    // : subobjectType === "markdown" ? -1 * subobjectID + 1800
    // : subobjectType === "to_do_list" ? -1 * subobjectID + 2800
    // : undefined;
};


/**
 * Returns composite & non composite object IDs in the composite hierarchy for the provided `objectID`.
 */
export const getMockCompositeHierarchyElements = objectID => {
    const strObjectID = objectID.toString();
    switch (strObjectID) {
        // return {"composite": list(all_composite), "non_composite": list(all_non_composite)}
        case "3910": return { 
            composite: [/* 3910 */ 3910, 3901, 3907, 3909, 3911, 3912,
            /* 3901 */ 3101,
            /* 3907 */ 3201,
            /* 3909 */ 3301
        ], non_composite: [
                /* 3910, 3911, 3912 */ 401, 1401, 2401,
                /* 3901, 3101 */ 101, 1101, 2101, 3101,
                /* 3907 */ 201, 1201, 2201, 202, 1202, 203,
                /* 3909 */ 301, 1301, 2301, 302, 1302, 2302, 303, 1303, 304,
                /* 3911 */ 411, 
                /* 3912 */ 421
        ]};
        default: throw(`getMockCompositeHierarchyElements received an unexpected objectID: ${objectID}`);
    }
};


/**
 * Returns a mock to-do list object data based on the provided `objectID`.
 * If `overrideValues` is passed and default object data is returned, the returned attribute value are overriden with provided via this param.
 * 
 * NOTE: `getMockCompositeHierarchyElements` should be updated when custom composite objects are updated.
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
        case "3907": return compositeWithGroupedLinksDisplayMode;
        case "3908": return compositeWithGroupedLinksDisplayModeAndNoLinkSubobjects;
        case "3909": return compositeMulticolumnDisplayMode;
        case "3910": return compositeChaptersRoot;
        case "3911": return compositeChaptersLevelOneSubroot;
        case "3912": return compositeChaptersLevelTwoSubroot;
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


export const compositeWithGroupedLinksDisplayMode = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(201, 0, 0),
        generateCompositeSubobject(1201, 0, 1),
        generateCompositeSubobject(2201, 0, 2),
        generateCompositeSubobject(3201, 1, 0),
        generateCompositeSubobject(202, 1, 1),
        generateCompositeSubobject(1202, 1, 2),
        generateCompositeSubobject(203, 2, 0)
    ],
    display_mode: "grouped_links"
});


export const compositeWithGroupedLinksDisplayModeAndNoLinkSubobjects = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(1201, 0, 1),
        generateCompositeSubobject(2201, 0, 2),
        generateCompositeSubobject(3201, 1, 0)
    ],
    display_mode: "grouped_links"
});


export const compositeMulticolumnDisplayMode = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(301, 0, 0),
        generateCompositeSubobject(1301, 0, 1),
        generateCompositeSubobject(2301, 0, 2),

        generateCompositeSubobject(3301, 0, 3),
        generateCompositeSubobject(302, 1, 0),
        generateCompositeSubobject(1302, 1, 1),
        generateCompositeSubobject(2302, 1, 2),
        generateCompositeSubobject(303, 2, 0),
        generateCompositeSubobject(1303, 2, 1),
        generateCompositeSubobject(304, 3, 0)
    ],
    display_mode: "multicolumn"
});


/**
 * - composite chapters root:
 *     - link, markdown, to-do list;
 *     - composite basic:
 *          - link, markdown, to-do list;
 *          - composite basic:
 *              - link;
 *     - composite grouped links;
 *     - composite multicolumn;
 *     - composite chapters:
 *          - link;
 *          - composite chapters:
 *              - link;
 */
export const compositeChaptersRoot = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(401, 0, 0),      // non-composite
        generateCompositeSubobject(1401, 0, 1),
        generateCompositeSubobject(2401, 0, 2),
        
        generateCompositeSubobject(3901, 0, 3),     // composite basic with link, markdown, to-do list & composite basic subobjects

        generateCompositeSubobject(3907, 0, 4),     // composite grouped_links

        generateCompositeSubobject(3909, 1, 0),     // composite multicolumn
        generateCompositeSubobject(3911, 1, 1)      // composite chapters
    ],
    display_mode: "chapters"
});


export const compositeChaptersLevelOneSubroot = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(411, 0, 0),  // link
        generateCompositeSubobject(3912, 0, 1)  // 2nd level subroot
    ],
    display_mode: "chapters"
});


export const compositeChaptersLevelTwoSubroot = generateCompositeObjectData(undefined, {
    subobjects: [
        generateCompositeSubobject(421, 0, 0)  // link
    ],
    display_mode: "chapters"
});
