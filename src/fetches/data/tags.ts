import { FetchRunner, FetchResult, FetchErrorType } from "../fetch-runner";

import { tag } from "../../store/types/data/tags";
import { TagsSelectors } from "../../store/selectors/data/tags";


import { addTags, deleteTags } from "../../reducers/data/tags";
import { updateObjectsTags } from "../../reducers/data/objects-tags";
import { addObjects } from "../../actions/data-objects";
import { deselectTags } from "../../reducers/ui/tags-list";
import { resetEditedObjectsTags } from "../../actions/objects-edit";

import { checkIfTagNameExists } from "../../store/state-util/tags";

import { addTagsTagSchema } from "../types/data/tags";

import type { AddTagsTagSchema } from "../types/data/tags";
import type { Dispatch, GetState } from "../../util/types/common";


/**
 * Fetches backend to add provided `tagAttributes` as a new tag. 
 * 
 * Adds the new tag to the state in case of success.
 */
export const tagsAddFetch = (tagAttributes: AddTagsTagSchema) => {
    return async (dispatch: Dispatch, getState: GetState) => {
        // Ensure correct tag attributes
        tagAttributes = addTagsTagSchema.parse(tagAttributes);

        // Check if tag_name already exists in local storage
        if (TagsSelectors.getTagIDByName(getState(), tagAttributes.tag_name) !== undefined)
            return FetchResult.fetchNotRun({ error: "Tag name already exists.", errorType: FetchErrorType.general });
        
        // Fetch backend
        const runner = new FetchRunner("/tags/add", { method: "POST", body: { tag: tagAttributes }});
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const tagFromResponse = tag.parse(result.json?.tag);
                dispatch(addTags([tagFromResponse]));
                return result;
            default:
                return result;
        }
    };
};
