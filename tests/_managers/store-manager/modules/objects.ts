import { addObjectsAttributes, updateObjectsAttributes, addObjectsDataFromBackend, updateObjectsData } from "../../../../src/reducers/data/objects";

import type { PartialExcept } from "../../../../src/util/types/common";
import type { AppStore } from "../../../../src/store/types/store";
import type { DataGenerator } from "../../../_mock-data/data-generator";
import type { ObjectType, ObjectAttributes, PartialObjectData, ObjectData } from "../../../_mock-data/modules/objects";
import type { PickPartial } from "../../../../src/util/types/common";



/**
 * Performs operations with objects' attributes, tags and data stores in the state.
 */
export class ObjectsStoreManager {
    store: AppStore
    generator: DataGenerator

    constructor(store: AppStore, generator: DataGenerator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Generates attributes (excluding object's tags) for an object with `object_id` and adds them to the state.
     * 
     * Custom attributes can be passed in the `attributes` argument.
     */
    addAttributes(object_id: number, attributes?: Partial<ObjectAttributes>): PickPartial<ObjectAttributes, "current_tag_ids"> {
        const objectAttributes = this.generator.object.attributes({ ...(attributes || {}), object_id }) as PickPartial<ObjectAttributes, "current_tag_ids">;
        delete objectAttributes.current_tag_ids;
        this.store.dispatch(addObjectsAttributes([ objectAttributes ]));
        return objectAttributes;
    }

    /**
     * Updates attributes of an existing object with provided `attributes`.
     * 
     * `attributes` must include `object_id` prop.
     */
    updateAttributes(attributes: PartialExcept<ObjectAttributes, "object_id">): void {
        if (typeof attributes.object_id === "string") attributes.object_id = parseInt(attributes.object_id);
        this.store.dispatch(updateObjectsAttributes([ attributes ]));
    }

    /**
     * Generates object data for an object with specified `object_id` and `object_type` and adds it to the state.
     * 
     * Custom attributes can be passed in the `object_data` argument.
     */
    addData<T extends ObjectType>(object_id: number, object_type: T, object_data: PartialObjectData<T>): ObjectData<T> {
        const objectData = this.generator.object.data(object_id, object_type, object_data);
        this.store.dispatch(addObjectsDataFromBackend([{ object_id, object_type, object_data: objectData }]));
        return objectData;
    }

    /**
     * Updates object data of an existing object with `object_id` and `object_type` with provided `object_data`.
     * 
     * `attributes` must include `object_id` prop.
     */
    updateData(object_id: number, object_type: ObjectType, object_data: any): void {
        this.store.dispatch(updateObjectsData([{ object_id, object_type, object_data }]));
    }

    /**
     * Updates properties of an existing composite subobject with values from `subobject`.
     * 
     * `object_id` and `subobject_id` are the ids of object and its subobject, respectively
     */
    updateCompositeSubobjectData(object_id: number, subobject_id: number, subobject: any): void {
        this.updateData(object_id, "composite", { subobjects: { [subobject_id]: subobject }});
    }
}
