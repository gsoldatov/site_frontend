import type { Link } from "./data/links"
import type { Markdown } from "./data/markdown"
import type { ToDoList } from "./data/to-do-list"
import type { Composite } from "./data/composite"
import { ObjectType } from "./data/objects";


/** Any of object data types in the store format. */
export type ObjectData = Link | Markdown | ToDoList | Composite;

/** Mapping between object type and its data */
export type ObjectDataMap<T> = 
    T extends "link" ? Link
    : T extends "markdown" ? Markdown
    : T extends "to_do_list" ? ToDoList
    : T extends "composite" ? Composite
    : never
;
