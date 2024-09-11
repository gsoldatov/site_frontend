import { ObjectGenerator } from "./objects";
import { TagGenerator } from "./tags";
import { UserGenerator } from "./users";


/**
 * Provides interface for specific data generators
 */
export class DataGenerator {
    constructor() {
        this.object = new ObjectGenerator();
        this.tag = new TagGenerator();
        this.user = new UserGenerator();
    }
}
