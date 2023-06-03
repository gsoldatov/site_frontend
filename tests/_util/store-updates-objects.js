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


// /**
//  * Updates composite subobject's data inside `store` with `newData`.
//  * 
//  * @param {object} store - Redux store object.
//  * @param {number} objectID - ID of a composite object.
//  * @param {number} subobjectID - ID of a subobject to be updated.
//  * @param {object} newData - object with new subobject's data.
//  */
// export const updateStoredCompositeSubobjectData = (store, objectID, subobjectID, newData) => {
//     let state = store.getState();
//     let parentObjectData = { ...state.composite[subobjectID], subobjects: [] };

//     Object.keys(store.getState().composite[objectID].subobjects).forEach(soID => {
//         let subobjectData = { ...state.composite[objectID].subobjects[soID] };
//         if (soID === subobjectID) subobjectData = { ...subobjectData, newData };
//         parentObjectData.subobjects.push(subobjectData);
//     });

//     store.dispatch(addObjectData([{ object_id: objectID, object_type: "composite", object_data: parentObjectData }]));
// };
