import { z } from "zod";

import { nonNegativeInt, positiveInt } from "../../common";
import { type FetchResult } from "../../../fetches/fetch-runner";


/** /search request body's `query` attribute type. */
export type SearchRequestQuery = {
    query_text: string,
    page: number,
    items_per_page: number
};


/** A single search result item in /search response body. */
const searchResultItem = z.object({ item_id: positiveInt, item_type: z.enum(["tag", "object"]) });

/** /search response body schema. */
export const searchResponseBodySchema = z.object({
    items: searchResultItem.array(),
    total_items: nonNegativeInt
});

type SearchResultItem = z.infer<typeof searchResultItem>;
export type SearchFetchResult = FetchResult | FetchResult & { items: SearchResultItem[], total_items: number };
