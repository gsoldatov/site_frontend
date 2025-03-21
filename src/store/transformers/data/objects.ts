import type { BackendLink, BackendMarkdown, BackendToDoList, BackendComposite, BackendObjectData } from "../../../types/fetches/data/objects/general";
import { getLink, type Link } from "../../../types/store/data/links";
import { getMarkdown, type Markdown } from "../../../types/store/data/markdown";
import { type ToDoList, getToDoListItem, getToDoList } from "../../../types/store/data/to-do-list";
import { type Composite, getCompositeSubobject, getComposite } from "../../../types/store/data/composite";
import type { ObjectData } from "../../../types/store/general";
import { type EditedObject } from "../../../types/store/data/edited-objects";


export class ObjectsTransformers {
    /** Converts `data` from backend to store format. */
    static backendDataToStore<T extends BackendObjectData, R = BackendToStoreDataMap<T>>(data: T): R {
        // link
        if ("link" in data) return getLink(data) as R;

        // markdown
        if ("raw_text" in data) return getMarkdown(data) as R;
        
        // to-do list
        if ("items" in data) {
            const itemOrder: number[] = [];
            const items = data.items.reduce((result, item) => {
                result[item.item_number] = getToDoListItem(item);
                itemOrder.push(item.item_number);
                return result;
            }, {} as ToDoList["items"]);
            return getToDoList({ ...data, items, itemOrder }) as R;
        }

        // composite
        if ("subobjects" in data) {
            const subobjects = data.subobjects.reduce((result, so) => {
                result[so.subobject_id] = getCompositeSubobject(so);
                return result;
            }, {} as Composite["subobjects"]);
            return getComposite({ ...data, subobjects }) as R;
        }
        
        throw Error(`Failed to convert backend data: ${data}`);
    }
    
    /** Converts `data` from store format to a corresponding part of an edited object. */
    static storeDataToEdited<T extends ObjectData, R = StoreToEditedObjectAttributeMap<T>>(data: T): R {
        if ("link" in data) return { link: data } as R;
        if ("raw_text" in data) return { markdown: data as Markdown } as R;
        if ("items" in data) return  { toDoList: data as ToDoList } as R;
        if ("subobjects" in data) return { composite: data as Composite } as R
        throw Error(`Failed to convert store data: ${data}`);
    }

    /** Converts `data` from backend format to a corresponding part of an edited object. */
    static backendDataToEdited<T extends BackendObjectData, R = StoreToEditedObjectAttributeMap<T>>(data: T): R {
        const storeData = ObjectsTransformers.backendDataToStore(data);
        return ObjectsTransformers.storeDataToEdited(storeData);
    }
}


type BackendToStoreDataMap<T> = 
    T extends BackendLink ? Link :
    T extends BackendMarkdown ? Markdown :
    T extends BackendToDoList ? ToDoList :
    T extends BackendComposite ? Composite :
    never
;


type StoreToEditedObjectAttributeMap<T> =
    T extends Link ? Pick<EditedObject, "link"> :
    T extends Markdown ? Pick<EditedObject, "markdown"> :
    T extends ToDoList ? Pick<EditedObject, "toDoList"> :
    T extends Composite ? Pick<EditedObject, "composite"> :
    never
;


type BackendToEditedObjectAttributeMap<T> = 
    T extends BackendLink ? Pick<EditedObject, "link"> :
    T extends BackendMarkdown ? Pick<EditedObject, "markdown"> :
    T extends BackendToDoList ? Pick<EditedObject, "toDoList"> :
    T extends BackendComposite ? Pick<EditedObject, "composite"> :
    never
;