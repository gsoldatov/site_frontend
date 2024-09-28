import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";

import { FeedContainer, FeedCardsContainer } from "../../modules/feed/feed-container";
import { ObjectFeedCard } from "../../state-users/feed/object-feed-card";
import { FeedPagination } from "../../modules/feed/feed-pagination";

import { loadIndexPageObjects } from "../../../fetches/ui-index";


/**
 * Objects feed component.
 * 
 * Fetches displayed objects and renders feed cards for them and feed pagination.
 */
export const ObjectsFeed = ({ page, items_per_page = 10 }) => {
    const dispatch = useDispatch();

    // Pagination info
    const [paginationInfo, setPaginationInfo] = useState({
            page,
            items_per_page,
            order_by: "feed_timestamp",
            sort_order: "desc",
            show_only_displayed_in_feed: true,

            totalItems: 0,
            currentPageObjectIDs: []
    });

    // On load fetch
    const onLoad = useMemo(() => async () => {
        let newPaginationInfo = { page, items_per_page };
        for (let attr of ["order_by", "sort_order", "show_only_displayed_in_feed"])
            newPaginationInfo[attr] = paginationInfo[attr];

        const result = await dispatch(loadIndexPageObjects(newPaginationInfo));
        
        // Set object IDs and total number of objects
        if (!("error" in result)) {
            newPaginationInfo.currentPageObjectIDs = result["object_ids"];
            newPaginationInfo.totalItems = result["total_items"];
            setPaginationInfo(newPaginationInfo);
        }
        
        return result;
    
    }, [page, items_per_page]);

    // Feed pagination params
    const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.items_per_page) : null;
    const paginationURLGetter = useMemo(() => newPage =>  newPage > 1 ? `/feed/${newPage}` : "/", []);

    // Object feed cards
    const feedCards = paginationInfo.currentPageObjectIDs.map(objectID => <ObjectFeedCard key={objectID} objectID={objectID} />);

    return (
        <FeedContainer onLoad={onLoad}>
            <FeedCardsContainer>
                {feedCards}
            </FeedCardsContainer>
            <FeedPagination currentPage={page} totalPages={totalPages} getURL={paginationURLGetter} />
        </FeedContainer>
    );
};
