import React, {useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Pagination } from "../../modules/pagination";

import { pageFetch } from "../../../fetches/ui-objects-list";


/**
 * /objects/list pagination component
 */
export const ObjectsListPagination = () => {
    const dispatch = useDispatch();
    const { currentPage, totalItems, itemsPerPage } = useSelector(state => state.objectsUI.paginationInfo);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const onPageChange = useMemo(() => (e, props) => {
        dispatch(pageFetch(props.activePage));
    }, []);

    return <Pagination activePage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />;
};
