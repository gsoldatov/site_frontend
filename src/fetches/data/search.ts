import { FetchRunner } from "../fetch-runner";

import type { Dispatch, GetState } from "../../store/types/store";
import { searchResponseBodySchema, type SearchRequestQuery, type SearchFetchResult } from "../types/data/search";


/**
 * Fetches the mathcing items for the provided search `query`.
 * 
 * Returns current query params, list of matching `items` { item_id, item_type } and `total_items` number.
 */
export const searchFetch = (query: SearchRequestQuery) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<SearchFetchResult> => {
        // Fetch backend
        const runner = new FetchRunner("/search", { method: "POST", body: { query } });
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const { items, total_items } = searchResponseBodySchema.parse(result.json);
                return result.withCustomProps({ items, total_items });
            default:
                return result;
        }
    };
};
