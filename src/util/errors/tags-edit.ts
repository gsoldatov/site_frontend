import { type FetchResult } from "../../fetches/fetch-runner";


/**
 * Attempts to process a fetch error text as a /tags/add or /tags/update Pydantic validation error list
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
export const parseTagsAddUpdatePydanticErrors = (fetchResult: FetchResult): string => {
    // Return the whole error text, if its not a list of Pydantic errors
    const { pydanticErrors } = fetchResult;
    if (pydanticErrors === null) return fetchResult.error!;

    // Loop through errors to find an error, which matches one of the looked up patterns
    for (let error of pydanticErrors) {
        let errorMessage;

        // Tag errors
        if (error.loc[0] === "tag") {
            // Tag name
            if (error.loc[1] === "tag_name") {
                if (error.type === "string_too_short") errorMessage = "Tag name is required.";
                if (error.type === "string_too_long") errorMessage = "Tag name can't be longer than 255 chars.";
            }
        }

        if (errorMessage !== undefined) return errorMessage;
    }

    // Return the whole error, if no matching error patterns were found
    return fetchResult.error!;
};
