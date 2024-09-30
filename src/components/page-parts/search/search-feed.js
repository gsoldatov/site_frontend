import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";

import { FeedContainer, FeedCardsContainer } from "../../modules/feed/feed-container";
import { TagFeedCard } from "../../state-users/feed/tag-feed-card";
import { ObjectFeedCard } from "../../state-users/feed/object-feed-card";
import { FeedPagination } from "../../modules/feed/feed-pagination";

import { loadSearchPageItems } from "../../../fetches/ui-search";


/**
 * Search results feed component.
 * 
 * Fetches matching items, then renders feed cards for them and feed pagination.
 */
export const SearchFeed = ({ query, page }) => {
    const dispatch = useDispatch();

    // Displayed cards state and paramse
    const [displayedItems, setDisplayedItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const items_per_page = 10;

    // On load fetch
    const onLoad = useMemo(() => async () => {
        // Missing query case
        if (!query) {
            setDisplayedItems([]);
            setTotalItems(0);
            return {};
        }

        // Run search fetch
        const fetchQuery = { query_text: query, page, items_per_page };
        const result = await dispatch(loadSearchPageItems(fetchQuery));

        // Set object IDs and total number of objects
        if (!("error" in result)) {
            setDisplayedItems(result.items);
            setTotalItems(result.total_items);
        }
        
        return result;
    }, [query, page]);

    // Feed cards
    const feedCards = displayedItems.map(item => {
        if (item.item_type === "tag") return <TagFeedCard key={`t_${item.item_id}`} tagID={item.item_id} />;        
        return <ObjectFeedCard key={`o_${item.item_id}`} objectID={item.item_id} />
    });

    // Feed pagination params
    const totalPages = displayedItems ? Math.ceil(totalItems / items_per_page) : null;
    const getNewURL = useMemo(() => newPage => {
        const params = new URLSearchParams();
        params.append("q", query);
        if (newPage > 1) params.append("p", newPage);
        return `/search?${params.toString()}`;
    }, [query]);

    return (
        <FeedContainer onLoad={onLoad}>
            <FeedCardsContainer>
                {feedCards}
            </FeedCardsContainer>
            <FeedPagination activePage={page} totalPages={totalPages} getNewURL={getNewURL} />
        </FeedContainer>
    );
};
