import { addObjectData, addObjects } from "../../src/actions/data-objects";


/**
 * Updates attributes of an object with `objectID` inside `store` with `newAttributes`.
 * 
 * @param {object} store - Redux store object.
 * @param {number} objectID - ID of an object to be updated.
 * @param {object} newAttributes - object with new attribute values.
 */
export const updateStoredObjectAttributes = (store, objectID, newAttributes) => {
    let objectAttributes = { ...store.getState().objects[objectID], ...newAttributes };
    store.dispatch(addObjects([ objectAttributes ]));
};


/**
 * Updates data on an existing link in store.
 * 
 * @param {object} store - Redux store object.
 * @param {number} objectID - ID of a link to be updated.
 * @param {object} newAttributes - object with new link data.
 */
export const updateStoredLinkData = (store, objectID, newData) => {
    const linkData = { ...store.getState().links[objectID], ...newData };
    store.dispatch(addObjectData([{ object_id: objectID, object_type: "link", object_data: linkData }]));
};


/**
 * Updates data on an existing Markdown object in store.
 * 
 * @param {object} store - Redux store object.
 * @param {number} objectID - ID of the object to be updated.
 * @param {object} newAttributes - object with new Markdown data.
 */
export const updateStoredMarkdownData = (store, objectID, newData) => {
    const objectData = { ...store.getState().markdown[objectID], ...newData };
    store.dispatch(addObjectData([{ object_id: objectID, object_type: "markdown", object_data: objectData }]));
};


/**
 * Updates composite subobject's data inside `store` with `newData`.
 * 
 * @param {object} store - Redux store object.
 * @param {number} objectID - ID of a composite object.
 * @param {number} subobjectID - ID of a subobject to be updated.
 * @param {object} newData - object with new subobject's data.
 */
export const updateStoredCompositeSubobjectData = (store, objectID, subobjectID, newData) => {
    let state = store.getState();
    let compositeObjectData = { ...state.composite[objectID], subobjects: [] };

    Object.keys(state.composite[objectID].subobjects).forEach(soID => {
        let subobjectData = { ...state.composite[objectID].subobjects[soID], object_id: soID };
        if (soID === subobjectID) subobjectData = { ...subobjectData, ...newData };
        compositeObjectData.subobjects.push(subobjectData);
    });
    
    store.dispatch(addObjectData([{ object_id: objectID, object_type: "composite", object_data: compositeObjectData }]));
};
