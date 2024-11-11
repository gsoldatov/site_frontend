import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Pagination } from "../../modules/pagination";

import { tagsListPageFetch } from "../../../fetches/ui/tags-list";


/**
 * /tags/list pagination component
 */
export const TagsListPagination = () => {
    const dispatch = useDispatch();
    const { currentPage, totalItems, itemsPerPage } = useSelector(state => state.tagsListUI.paginationInfo);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const onPageChange = useMemo(() => (e, props) => {
        dispatch(tagsListPageFetch(props.activePage));
    }, []);

    return <Pagination activePage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />;    
};
