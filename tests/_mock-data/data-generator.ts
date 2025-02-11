
import { SettingsGenerator } from "./modules/settings";
import { AuthGenerator } from "./modules/auth";
import { UserGenerator } from "./modules/users";
import { TagGenerator } from "./modules/tags";
import { ObjectGenerator } from "./modules/objects";
import { EditedObjectGenerator } from "./modules/edited-object";


/**
 * Provides interface for specific data generators
 */
export class DataGenerator {
    settings: SettingsGenerator
    auth: AuthGenerator
    user: UserGenerator
    tag: TagGenerator
    object: ObjectGenerator
    editedObject: EditedObjectGenerator

    constructor() {
        this.settings = new SettingsGenerator();
        this.auth = new AuthGenerator();
        this.user = new UserGenerator();
        this.tag = new TagGenerator();
        this.object = new ObjectGenerator();
        this.editedObject = new EditedObjectGenerator();
    }
}
