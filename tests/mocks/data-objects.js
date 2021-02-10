// Return mocked object type base on its ID
export function getObjectTypeFromID(objectID) {
    if (objectID >= 1 && objectID <= 1000) {
        return "link";
    } else if (objectID >= 1001 && objectID <= 2000) {
        return "markdown";
    } else if (objectID >= 2001 && objectID <= 3000) {
        return "to_do_list";
    } else {
        return "unknown";
    }
}