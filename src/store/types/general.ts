import type { Link } from "./data/links"
import type { Markdown } from "./data/markdown"
import type { ToDoList } from "./data/to-do-list"
import type { Composite } from "./data/composite"


/** Any of object data types in the store format. */
export type ObjectData = Link | Markdown | ToDoList | Composite;
