import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Pagination } from "semantic-ui-react";

import StyleFieldPagination from "../../styles/field-pagination.css";


/* Field pagination component. */
export default ({ paginationInfoSelector, setCurrentPage }) => {
    const dispatch = useDispatch();
    const paginationInfo = useSelector(paginationInfoSelector);
    const currentPage = paginationInfo ? paginationInfo.currentPage : null;
    const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.itemsPerPage) : null;
    
    const onChange = (e, props) => {
        dispatch(setCurrentPage(props.activePage));
    }
    return paginationInfo && totalPages > 1 && (
        <div className="field-pagination">
            <Pagination activePage={currentPage} totalPages={totalPages} siblingRange={2} firstItem={null} lastItem={null} onPageChange={onChange}/>
        </div>
    );
};