import React, { useEffect, useMemo, useState } from "react";
import { Redirect } from "react-router";

import { Pagination } from "../pagination";


/**
 * Feed pagination component
 */
export const FeedPagination = ({ activePage, totalPages, getNewURL }) => {
    // On page change redirect state
    const [redirectURL, setRedirectURL] = useState("");

    // Clear redirect URL after URL
    useEffect(() => {
        if (redirectURL.length > 0) setRedirectURL("");
    }, [redirectURL]);

    // Pagination buttons on click handler
    const onPageChange = useMemo(() => (e, props) => {
        const newPage = props.activePage;
        const redirectURL = getNewURL(newPage);
        setRedirectURL(redirectURL);
    }, [getNewURL]);

    // Render redirect after click
    if (redirectURL.length > 0) return <Redirect to={redirectURL} />;

    // Render pagination
    return <Pagination activePage={activePage} totalPages={totalPages} onPageChange={onPageChange} />;
};
