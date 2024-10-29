import { AuthGenerator } from "./modules/auth";
import { ObjectGenerator } from "./modules/objects";
import { SettingsGenerator } from "./modules/settings";
import { TagGenerator } from "./modules/tags";
import { UserGenerator } from "./modules/users";


/**
 * Provides interface for specific data generators
 */
export class DataGenerator {
    object: ObjectGenerator
    tag: TagGenerator
    user: UserGenerator
    auth: AuthGenerator
    settings: SettingsGenerator

    constructor() {
        this.object = new ObjectGenerator();
        this.tag = new TagGenerator();
        this.user = new UserGenerator();
        this.auth = new AuthGenerator();
        this.settings = new SettingsGenerator();
    }
}
