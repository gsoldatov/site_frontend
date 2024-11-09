import type { State } from "../../types/state";


export class TagsSelectors {
    /**
     * Returns `tag_id` of a tag in state with name, matching to `tagName` (in lower case), if such tag exists.
     * If `excludedTagID`, tag with this id is excluded from search.
     */
    static getTagIDByName(state: State, tagName: string, excludedTagID?: number): number | undefined {
        const loweredTagName = tagName.toLowerCase();
        
        for (let i in state.tags) {
            if (loweredTagName === state.tags[i].tag_name.toLowerCase() 
                && state.tags[i].tag_id !== excludedTagID) 
            return state.tags[i].tag_id;
        }
    }
}
