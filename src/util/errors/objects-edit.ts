import { type ZodError } from "zod";

import type { EditedObject } from "../../types/store/data/edited-objects";


/**
 * Processes validation errors during /objects/bulk_upsert request body serialization
 * into a string error message.
 * 
 * Current implementation tries to map the first occured error to a corresponding error message,
 * or returns the first error as is.
 */
export const parseObjectsBulkUpsertZodValidationErrors = (error: ZodError, editedObjects: EditedObject[], currentObjectID: number): string => {
    const firstIssue = error.issues[0];

    if (firstIssue.path[0] === "objects") {
        const editedObject = editedObjects[firstIssue.path[1] as number];
        const objectInfo = editedObject.object_id === currentObjectID ? ""
            : ` (object "${editedObject.object_name}" (${editedObject.object_id}))`;     // info about object, where error occured, if it's not current
        let message;

        // object_name
        if (firstIssue.path[2] === "object_name" && firstIssue.code === "too_small") 
            message = "Object name is required.";
        else if (firstIssue.path[2] === "object_name" && firstIssue.code === "too_big") 
            message = "Object name can't be longer than 255 chars.";

        // link data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "link" && firstIssue.message === "Invalid url")
             message = "Valid URL is required.";

        // markdown data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "raw_text" && firstIssue.code === "too_small") 
            message = "Markdown text is required.";

        // to-do list data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "items" && firstIssue.code === "too_small") 
            message = "At least one item is required in the to-do list.";

        else message = JSON.stringify(firstIssue);

        return `${message}${objectInfo}`;
    }
    
    return error.toString();
};
