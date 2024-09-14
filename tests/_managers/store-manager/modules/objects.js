import { addObjectData, addObjects, updateObjects, updateObjectData } from "../../../../src/actions/data-objects";


/**
 * Performs operations with objects' attributes, tags and data stores in the state.
 */
export class ObjectsStoreManager {
    constructor(store, generator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Generates attributes (excluding object's tags) for an object with `object_id` and adds them to the state.
     * 
     * Custom attributes can be passed in the `attributes` argument.
     */
    addAttributes(object_id, attributes = {}) {
        const objectAttributes = this.generator.object.attributes({ ...attributes, object_id });
        delete objectAttributes.current_tag_ids;
        this.store.dispatch(addObjects([ objectAttributes ]));
        return objectAttributes;
    }

    /**
     * Updates attributes of an existing object with provided `attributes`.
     * 
     * `attributes` must include `object_id` prop.
     */
    updateAttributes(attributes) {
        this.store.dispatch(updateObjects([ attributes ]));
    }

    /**
     * Generates object data for an object with specified `object_id` and `object_type` and adds it to the state.
     * 
     * Custom attributes can be passed in the `object_data` argument.
     */
    addData(object_id, object_type, object_data) {
        const objectData = this.generator.object.data(object_id, object_type, object_data);
        this.store.dispatch(addObjectData([{ object_id, object_type, object_data: objectData }]));
        return objectData;
    }

    /**
     * Updates object data of an existing object with `object_id` and `object_type` with provided `object_data`.
     * 
     * `attributes` must include `object_id` prop.
     */
    updateData(object_id, object_type, object_data) {
        this.store.dispatch(updateObjectData([{ object_id, object_type, object_data }]));
    }

    /**
     * Updates properties of an existing composite subobject with values from `subobject`.
     * 
     * `object_id` and `subobject_id` are the ids of object and its subobject, respectively
     */
    updateCompositeSubobjectData(object_id, subobject_id, subobject) {
        this.updateData(object_id, "composite", { subobjects: { [subobject_id]: subobject }});
    }
}
