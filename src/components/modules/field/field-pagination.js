import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pagination } from "semantic-ui-react";

import { OnResizeWrapper } from "../wrappers/on-resize-wrapper";

import StyleFieldPagination from "../../../styles/modules/pagination.css";


/**
 * Field pagination component.
 */
export const FieldPagination = ({ paginationInfoSelector, setCurrentPage }) => {
    const dispatch = useDispatch();
    const paginationInfo = useSelector(paginationInfoSelector);
    const currentPage = paginationInfo ? paginationInfo.currentPage : null;
    const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.itemsPerPage) : null;
    
    const onChange = useMemo(() => (e, props) => {
        dispatch(setCurrentPage(props.activePage));
    });

    // Change pagination parameters based on viewport width
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(window.innerWidth >= 500);
    const onResizeCallback = useMemo(() => paginationContainerRef => {
        const width = parseInt(getComputedStyle(paginationContainerRef).width.replace("px", ""));
        setIsFullscreenStyle(width >= 500);
    }, []);
    const siblingRange = isFullscreenStyle ? 2 : 0;

    return paginationInfo && totalPages > 1 && (
        <OnResizeWrapper callback={onResizeCallback}>
            <div className="pagination-container">
                <Pagination activePage={currentPage} totalPages={totalPages} siblingRange={siblingRange} firstItem={null} lastItem={null} onPageChange={onChange}/>
            </div>
        </OnResizeWrapper>
    );
};
