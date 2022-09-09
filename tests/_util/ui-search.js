import { fireEvent, waitFor } from "@testing-library/dom";

import { getFeedElements, getFeedCardElements } from "./ui-index";
import { getNavigationBarElements } from "./ui-navbar";


/**
 * Returns elements of a search page inside `container`.
 */
 export const getSearchPageElements = container => {
    let result = {
        search: {
            input: null,
            button: null
        },
        
        feed: {
            placeholders: {
                loading: null,
                fetchError: null
            },
    
            feedCards: {
                container: null,
                feedCards: []
            },
    
            pagination: {
                container: null,
                buttons: {}
            }
        }
    };

    const searchPageContaienr = container.querySelector(".search-page-container");

    if (searchPageContaienr) {
        /* Search input */
        const searchInputContainer = searchPageContaienr.querySelector(".search-input-container");

        if (searchInputContainer) {
            result.search.input = searchInputContainer.querySelector("input");
            result.search.button = searchInputContainer.querySelector("button");
        }

        /* Feed */
        result.feed = getFeedElements(searchPageContaienr);
    }

    return result;
};


/**
 * Compares IDs of displayed in search page `container` feed cards with `expectedItems`.
 * 
 * `expectedItems` is a list of objects with `item_id` and `item_type` props.
 */
 export const checkDisplayedSearchFeedCardIDs = (container, expectedItems) => {
    const objectsFeedElements = getFeedElements(container);
    const displayedItems = objectsFeedElements.feedCards.feedCards.map(p => {
        const elements = getFeedCardElements(p);
        if (elements.tagID) return { item_id: elements.tagID, item_type: "tag" };
        return { item_id: elements.objectID, item_type: "object" };
    });

    if (displayedItems.length !== expectedItems.length) throw Error(`Expected and displayed object feed card count do not match: ${expectedIDs.length} != ${displayedIDs.length}`);
    
    for (let i = 0; i < displayedItems.length; i++)
        if (displayedItems[i].item_id !== expectedItems[i].item_id || displayedItems[i].item_type !== expectedItems[i].item_type) 
           throw Error(`Expected and displayed object feed card ID number ${i} do not match:\n${JSON.stringify(expectedItems[i])} != ${JSON.stringify(displayedItems[i])}`);
};


/**
 * Finds navbar search input inside `container`, types provided `query` into it, submits the query and wait for search page to load.
 */
export const submitSearchQueryWithNavbar = async (container, history, query) => {
    const { search } = getNavigationBarElements(container);
    fireEvent.change(search.input, { target: { value: query } });
    fireEvent.keyDown(search.input, { key: "Enter", code: "Enter" });

    // Check if redirect occured
    expect(history.location.pathname).toEqual("/search");
    const URLQuery = (new URLSearchParams(history.location.search)).get("q");
    expect(URLQuery).toEqual(query);

    // Wait for search fetch to end
    await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
};
