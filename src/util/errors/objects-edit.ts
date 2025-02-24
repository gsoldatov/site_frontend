import { type ZodError } from "zod";


import { FetchResult } from "../../fetches/fetch-runner";

import { type ObjectsBulkUpsertRequestBody } from "../../types/fetches/data/objects/bulk_upsert";
import { type ObjectType } from "../../types/store/data/objects";
import type { EditedObject } from "../../types/store/data/edited-objects";
import { State } from "../../types/store/state";


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
            : getObjectInfo(editedObject.object_name, editedObject.object_id);     // info about object, where error occured, if it's not current
        let message;

        // object_name
        if (firstIssue.path[2] === "object_name" && firstIssue.code === "too_small") 
            message = mappedErrorMessages["objectNameTooShort"];
        else if (firstIssue.path[2] === "object_name" && firstIssue.code === "too_big") 
            message = mappedErrorMessages["objectNameTooLong"];

        // link data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "link" && firstIssue.message === "Invalid url")
             message = mappedErrorMessages["linkInvalidURL"];

        // markdown data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "raw_text" && firstIssue.code === "too_small") 
            message = mappedErrorMessages["markdownTooShort"];

        // to-do list data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "items" && firstIssue.code === "too_small") 
            message = mappedErrorMessages["toDoListItemsTooShort"];

        else message = JSON.stringify(firstIssue);

        return `${message}${objectInfo}`;
    }
    
    return error.toString();
};


/**
 * Attempts to process a fetch error text as a /objects/bulk_upsert Pydantic validation error list
 * and return an error message corresponding on its contents.
 * 
 * If the error does not contain Pydantic error list, it is returned as-is.
 * 
 * Looks for the first the error, which is one of the following:
 * - object validation error caused by the schema, which matches its type
 *   (i.e. "link" object validation errors will be ignored for a "markdown" object);
 * - deleted_object_ids validation error.
 * 
 * If a matching error was found, processes it into an error message & returns the processed message or the original error.
 * 
 * If no matching errors found, the whole error text is returned.
 */
export const parseObjectsBulkUpsertPydanticErrors = (fetchResult: FetchResult, state: State): string => {
    // Return the whole error text, if its not a list of Pydantic errors
    const { pydanticErrors } = fetchResult;
    if (pydanticErrors === null) return fetchResult.error!;

    // Loop through errors to find an error, which matches one of the looked up patterns
    for (let error of pydanticErrors) {
        let errorMessage;

        // General errors
        if (error.loc.length === 0) {
            if (error.msg.match("Added tags can contain a maximum of")) errorMessage = mappedErrorMessages["sharedAddedTagsTooLong"];
            if (error.msg.match("Removed tag IDs can contain a maximum")) errorMessage = mappedErrorMessages["sharedRemovedTagIDsTooLong"];
        }

        // `objects` list errors
        if (error.loc[0] === "objects" && error.loc.length === 1) {
            if (error.type === "too_long") errorMessage = mappedErrorMessages["objectsTooLong"];
        }

        // `deleted_object_ids` list errors
        if (error.loc[0] === "deleted_object_ids" && error.loc.length === 1) {
            if (error.type === "too_long") errorMessage = mappedErrorMessages["deletedObjectIDsTooLong"];
        }

        // Object validation errors
        if (error.loc[0] === "objects" && error.loc.length > 1) {
            const objectPosition = error.loc[1] as unknown as number;
            const object = (fetchResult.requestBody as ObjectsBulkUpsertRequestBody).objects[objectPosition];
            const { object_id, object_name, object_type } = object;
            
            // Filter errors from schemae not matching to the type of the object
            if (error.loc[2] !== objectTypeSchemaMap[object_type]) continue;

            // object_name
            if (error.loc[3] === "object_name") {
                if (error.type === "string_too_short") errorMessage = mappedErrorMessages["objectNameTooShort"];
                if (error.type === "string_too_long") errorMessage = mappedErrorMessages["objectNameTooLong"];
            }

            // added tags
            if (error.loc[3] === "added_tags") {
                if (error.type === "too_long") errorMessage = mappedErrorMessages["addedTagsTooLong"];
            }

            // removed tag IDs
            if (error.loc[3] === "removed_tag_ids") {
                if (error.type === "too_long") errorMessage = mappedErrorMessages["removedTagIDsTooLong"];
            }

            // link
            if (object_type === "link" && error.loc[3] === "object_data") {
                if (error.loc[4] === "link" && error.type === "url_parsing")
                    errorMessage = mappedErrorMessages["linkInvalidURL"];
            }

            // markdown
            if (object_type === "markdown" && error.loc[3] === "object_data") {
                if (error.loc[4] === "raw_text" && error.type === "string_too_short")
                    errorMessage = mappedErrorMessages["markdownTooShort"];
            }

            // to-do list
            if (object_type === "to_do_list" && error.loc[3] === "object_data") {
                if (error.loc[4] === "items" && error.type === "too_short")
                    errorMessage = mappedErrorMessages["toDoListItemsTooShort"];
            }

            // Display the whole error, if it was not processed
            if (errorMessage === undefined) errorMessage = JSON.stringify(error);

            // Add object name & ID to the message, if the error occured not in the current edited object (which is first in the list).
            if (object_id !== state.objectsEditUI.currentObjectID)
                errorMessage += getObjectInfo(object_name, object_id);
        }

        if (errorMessage !== undefined) return errorMessage;
    }

    // Return the whole error, if no matching error patterns were found
    return fetchResult.error!;
};


/** Mapping between object type and Pydantic schema names. */
const objectTypeSchemaMap: Record<ObjectType, string> = {
    "link": "UpsertedLink",
    "markdown": "UpsertedMarkdown",
    "to_do_list": "UpsertedToDoList",
    "composite": "UpsertedComposite"
};


const mappedErrorMessages = {
    "sharedAddedTagsTooLong": "Updated objects can have at most 1000 added tags in total.",
    "sharedRemovedTagIDsTooLong": "Updated objects can have at most 1000 removed tags in total.",

    "objectsTooLong": "Too many objects were passed to update.",
    "deletedObjectIDsTooLong": "Too many objects were marked for deletion.",

    "objectNameTooShort": "Object name is required.",
    "objectNameTooLong": "Object name can't be longer than 255 chars.",
    
    "addedTagsTooLong": "Object can have at most 100 added tags.",
    "removedTagIDsTooLong": "Object can have at most 100 removed tags.",
    
    "linkInvalidURL": "Valid URL is required.",
    "markdownTooShort": "Markdown text is required.",
    "toDoListItemsTooShort": "At least one item is required in the to-do list."
};


const getObjectInfo = (objectName: string, objectID: number) => ` [object "${objectName}" (${objectID})]`;
