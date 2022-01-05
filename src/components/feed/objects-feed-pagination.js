import React, { useEffect, useMemo, useState } from "react";
import { Redirect } from "react-router";
import { Pagination } from "semantic-ui-react";

import { OnResizeWrapper } from "../common/on-resize-wrapper";

import StyleFieldPagination from "../../styles/field-pagination.css";


/**
 * Objects feed pagination component.
 */
export const ObjectsFeedPagination = ({ paginationInfo }) => {
    const currentPage = paginationInfo ? paginationInfo.page : null;
    const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.items_per_page) : null;

    // Redirect URL state
    const [redirectURL, setRedirectURL] = useState("");

    // Clear redirect URL after URL
    useEffect(() => {
        if (redirectURL.length > 0) setRedirectURL("");
    }, [redirectURL]);

    // Pagination buttons click handler
    const onChange = useMemo(() => (e, props) => {
        const newPage = props.activePage;
        const newRedirectURL = newPage > 1 ? `/feed/${newPage}` : "/";
        setRedirectURL(newRedirectURL);
    });

    // Change pagination parameters based on viewport width
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(window.innerWidth >= 500);
    const onResizeCallback = useMemo(() => paginationContainerRef => {
        const width = parseInt(getComputedStyle(paginationContainerRef).width.replace("px", ""));
        setIsFullscreenStyle(width >= 500);
    }, []);
    const siblingRange = isFullscreenStyle ? 2 : 0;

    // Render redirect after click
    if (redirectURL.length > 0) return <Redirect to={redirectURL} />;

    // Render pagination
    return paginationInfo && totalPages > 1 && (
        <OnResizeWrapper callback={onResizeCallback}>
            <div className="objects-feed-pagination-container">
                <Pagination className="objects-feed-pagination" activePage={currentPage} totalPages={totalPages} siblingRange={siblingRange} firstItem={null} lastItem={null} onPageChange={onChange}/>
            </div>
        </OnResizeWrapper>
    );
};
