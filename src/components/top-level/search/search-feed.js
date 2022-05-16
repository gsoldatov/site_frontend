import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";

import { FeedContainer, FeedCardsContainer } from "../../feed/feed-container";
import { TagFeedCard } from "../../feed/feed-card/tag-feed-card";
import { ObjectFeedCard } from "../../feed/feed-card/object-feed-card";
import { FeedPagination } from "../../feed/feed-pagination";

import { loadSearchPageItems } from "../../../fetches/ui-search";


/**
 * Search results feed component.
 * 
 * Fetches matching items, then renders feed cards for them and feed pagination.
 */
export const SearchFeed = ({}) => {
    const dispatch = useDispatch();
    const location = useLocation();

    // Displayed cards state
    const [displayedItems, setDisplayedItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);

    // Fetch params
    const URLParams = new URLSearchParams(location.search);
    
    const query_text = URLParams.get("q");
    const p = URLParams.get("p");
    const page = parseInt(p) >= 1 ? parseInt(p) : 1;
    const items_per_page = 10;

    // On load fetch
    const onLoad = useMemo(() => async () => {
        // Incorrect URL params
        if (query_text.length === 0) {
            setDisplayedItems([]);
            setTotalItems(0);
            return {};
        }

        // Run search fetch
        const query = { query_text, page, items_per_page };
        const result = await dispatch(loadSearchPageItems(query));

        // Set object IDs and total number of objects
        if (!("error" in result)) {
            setDisplayedItems(result.items);
            setTotalItems(result.total_items);
        }
        
        return result;
    }, [query_text, page]);

    // Feed cards
    const feedCards = displayedItems.map(item => {
        if (item.item_type === "tag") return <TagFeedCard key={`t_${item.item_id}`} tagID={item.item_id} />;        
        return <ObjectFeedCard key={`o_${item.item_id}`} objectID={item.item_id} />
    });

    // Feed pagination params
    const totalPages = displayedItems ? Math.ceil(totalItems / items_per_page) : null;
    const paginationURLGetter = useMemo(() => newPage => {
        const params = new URLSearchParams();
        params.append("q", query_text);
        if (newPage > 1) params.append("p", newPage);
        return `/search?${params.toString()}`;
    }, [query_text]);

    return (
        <FeedContainer onLoad={onLoad}>
            <FeedCardsContainer>
                {feedCards}
            </FeedCardsContainer>
            <FeedPagination currentPage={page} totalPages={totalPages} getURL={paginationURLGetter} />
        </FeedContainer>
    );
};
