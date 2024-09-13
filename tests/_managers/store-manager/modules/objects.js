import { addObjectData, addObjects } from "../../../../src/actions/data-objects";


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
     * Generates object data for an object with specified `object_id` and `object_type` and adds it to the state.
     * 
     * Custom attributes can be passed in the `object_data` argument.
     */
    data(object_id, object_type, object_data) {
        const objectData = this.generator.object.data(object_id, object_type, object_data);
        this.store.dispatch(addObjectData([{ object_id, object_type, object_data: objectData }]));
        return objectData;
    }
}
