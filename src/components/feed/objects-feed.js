import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader, Message } from "semantic-ui-react";

import { loadIndexPageObjects } from "../../fetches/ui-index";

import { ObjectPreview } from "./object-preview";
import { ObjectsFeedPagination } from "./objects-feed-pagination";

import StyleObjectsFeed from "../../styles/objects-feed.css";



/**
 * Paginated feed of object previews.
 */
export const ObjectsFeed = ({ page, items_per_page = 10 }) => {
    const dispatch = useDispatch();

    // Logged user state
    const userID = useSelector(state => state.auth.user_id);

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

    // Fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch objects whenever a new page opens and current user or number of items per page is changed
    useEffect(() => {
        const onLoadFetch = async () => {
            setIsFetching(true);
            setError("");

            let newPaginationInfo = { page, items_per_page };
            for (let attr of ["order_by", "sort_order", "show_only_displayed_in_feed"])
                newPaginationInfo[attr] = paginationInfo[attr];

            const result = await dispatch(loadIndexPageObjects(newPaginationInfo));
            
            // Handle fetch errors
            if ("error" in result) setError(result["error"]);
            
            // Set object IDs and total number of objects
            else {
                newPaginationInfo.currentPageObjectIDs = result["object_ids"];
                newPaginationInfo.totalItems = result["total_items"];
                setPaginationInfo(newPaginationInfo);
            }

            // End fetch
            setIsFetching(false);
        };

        onLoadFetch();
    }, [page, items_per_page, userID]);

    // Error message
    if (error.length > 0) return (
        <Message error content={error} />
    );

    // Loading placeholder
    if (isFetching) return (
        <Loader active inline="centered">Loading...</Loader>
    );
    
    // Object preview & pagination controls
    const objectPreviews = paginationInfo.currentPageObjectIDs.map(objectID => <ObjectPreview key={objectID} objectID={objectID} />);

    return (
        <div className="objects-feed-container">
            <div className="objects-feed-previews-container">
                {objectPreviews}
            </div>
            <ObjectsFeedPagination paginationInfo={paginationInfo} />
        </div>
    );
};
