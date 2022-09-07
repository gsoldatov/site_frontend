import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";

import { FeedContainer, FeedCardsContainer } from "../../feed/feed-container";
import { ObjectFeedCard } from "../../feed/feed-card/object-feed-card";
import { FeedPagination } from "../../feed/feed-pagination";

import { tagsViewLoadPageObjects } from "../../../fetches/ui-tags-view";
import { useURLParamIDs } from "../../../util/use-url-param-array";


/**
 * /tags/view page objects feed component.
 * 
 * Fetches displayed objects and renders feed cards for them and feed pagination.
 */
export const TagPageObjectsFeed = ({ page, items_per_page = 1 }) => {
    const dispatch = useDispatch();
    const tagIDs = useURLParamIDs("tagIDs");

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
        // Don't fetch if no tags are selected
        if (tagIDs.length === 0) return;

        let newPaginationInfo = { page, items_per_page, tags_filter: tagIDs };
        for (let attr of ["order_by", "sort_order", "show_only_displayed_in_feed"])
            newPaginationInfo[attr] = paginationInfo[attr];

        const result = await dispatch(tagsViewLoadPageObjects(newPaginationInfo));
        
        // Set object IDs and total number of objects
        if (!("error" in result)) {
            newPaginationInfo.currentPageObjectIDs = result["object_ids"];
            newPaginationInfo.totalItems = result["total_items"];
            setPaginationInfo(newPaginationInfo);
        }
        
        return result;
    
    }, [page, items_per_page, tagIDs]);

    // Feed pagination params
    const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.items_per_page) : null;
    const paginationURLGetter = useMemo(() => newPage => {
        const params = new URLSearchParams();
        params.append("tagIDs", tagIDs);
        if (newPage > 1) params.append("p", newPage);
        return `/tags/view?${params.toString()}`;
    }, [tagIDs]);

    // Don't render if no tags are selected
    if (tagIDs.length === 0) return null;

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
