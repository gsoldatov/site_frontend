import { ObjectGenerator } from "./modules/objects";
import { TagGenerator } from "./modules/tags";
import { UserGenerator } from "./modules/users";


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
