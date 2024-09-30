import React, { memo, useMemo, useState } from "react";
import { Pagination as SUIRPagination } from "semantic-ui-react";

import { OnResizeWrapper } from "./wrappers/on-resize-wrapper";

import StyleFieldPagination from "../../styles/modules/pagination.css";


/**
 * Pagination component.
 */
export const Pagination = memo(({ activePage, totalPages, onPageChange }) => {
    // Set pagination styling based on its width
    const [isFullscreen, setIsFullscreen] = useState(window.innerWidth >= 500);
    const onResizeCallback = useMemo(() => paginationContainerRef => {
        const width = parseInt(getComputedStyle(paginationContainerRef).width.replace("px", ""));
        setIsFullscreen(width >= 500);
    }, []);
    const siblingRange = isFullscreen ? 2 : 0;

    return totalPages > 1 && (
        <OnResizeWrapper callback={onResizeCallback}>
            <div className="pagination-container">
                <SUIRPagination activePage={activePage} totalPages={totalPages} siblingRange={siblingRange} firstItem={null} lastItem={null} onPageChange={onPageChange}/>
            </div>
        </OnResizeWrapper>
    );
});
