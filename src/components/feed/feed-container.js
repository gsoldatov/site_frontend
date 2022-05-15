import React, { useEffect, useState } from "react";
import { Loader, Message } from "semantic-ui-react";

import StyleFeed from "../../styles/feed.css";


/**
 * Paginated feed container.
 * 
 * Provides loading placeholder and fetch error display logic and runs `onLoad` function whenever it changes.
 * 
 * Renders its children after fetch execution.
 */
export const FeedContainer = ({ onLoad, children }) => {
    // Fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch objects whenever a new page opens and current user or number of items per page is changed
    useEffect(() => {
        const onLoadFetch = async () => {
            setIsFetching(true);
            setError("");

            const result = await onLoad();
            
            // Handle fetch errors
            if ("error" in result) setError(result["error"]);

            // End fetch
            setIsFetching(false);
        };

        onLoadFetch();
    }, [onLoad]);

    // Error message
    if (error.length > 0) return (
        <div className="feed-container">
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching) return (
        <div className="feed-container">
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    return (
        <div className="feed-container">
            {children}
        </div>
    );
};


/**
 * Container component for children feed cards inside <FeedContainer>.
 */
export const FeedCardsContainer = ({ children }) => {
    return (
        <div className="feed-cards-container">
            {children}
        </div>
    );
};
