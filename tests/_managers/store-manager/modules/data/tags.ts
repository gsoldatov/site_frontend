import { addTags } from "../../../../../src/reducers/data/tags";

import type { AppStore } from "../../../../../src/types/store/store";
import type { DataGenerator } from "../../../../_mock-data/data-generator";
import type { Tag } from "../../../../_mock-data/modules/tags";

/**
 * Performs operations with `state.tags` part of the state.
 */
export class TagsStoreManager {
    store: AppStore
    generator: DataGenerator

    constructor(store: AppStore, generator: DataGenerator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Adds a tag data to the state.
     * 
     * Custom values for any attribute can be passed in the `customValues` argument.
     */
    add(customValues?: Partial<Tag>): Tag {
        const tag = this.generator.tag.tag(customValues || {});
        this.store.dispatch(addTags([tag]));
        return tag;
    }
}
