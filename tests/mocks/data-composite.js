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
        // case "2901": return enterKeyDownDefaultSortTDL;
        default: return defaultComposite;
    }
};


/*
    link
*/
const defaultComposite = {
    subobjects: [
        { object_id: 101, row: 0, column: 0, selected_tab: 0 }
    ]
};
