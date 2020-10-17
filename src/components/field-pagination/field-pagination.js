import React from "react";
import FieldPaginationButton from "./field-pagination-button";
import FieldPaginationGap from "./field-pagination-gap";

import StyleFieldPagination from "../../styles/field-pagination.css";

/*
    Component for rendering pagination block to change item pages being displayd.
    FieldPaginationContainer should be used instead of this class to connect it to the state.
*/
class FieldPagination extends React.Component {
    render() {
        const paginationInfo = this.props.paginationInfo;
        const currentPage = paginationInfo ? paginationInfo.currentPage : null;
        const totalPages = paginationInfo ? Math.ceil(paginationInfo.totalItems / paginationInfo.itemsPerPage) : null;
        const setCurrentPage = this.props.setCurrentPage;
        const isFetching = this.props.isFetching;

        if (isFetching || totalPages === 0 || totalPages === 1) {
            return null;
        }

        let paginationControls = [];
        let key = 0;

        paginationControls.push(<FieldPaginationButton key={key++} text={"Previous"} onClick={ () => setCurrentPage(Math.max(currentPage - 1, 1)) } />);
        paginationControls.push(<FieldPaginationButton key={key++} text={"1"} onClick={ () => setCurrentPage(1) } />);

        if (currentPage === 5) {
            paginationControls.push(<FieldPaginationButton key={key++} text={"2"} onClick={ () => setCurrentPage(2) } />);
        } else if (currentPage > 5) {
            paginationControls.push(<FieldPaginationGap key={key++} />);
        }

        for (let i = -2; i <= 2; i++) {
            let page = currentPage + i;
            if (page > 1 && page < totalPages
                && !(page === 2 && currentPage === 5)                                   // page 2 button is already inserted in this case
                && !(page === totalPages - 1 && currentPage === totalPages - 4)) {      // page totalPages - 1 button will be inserted later in this case
                    paginationControls.push(<FieldPaginationButton key={key++} text={`${page}`} onClick={ () => setCurrentPage(page) } />);
                }
            
        }

        if (currentPage === totalPages - 4) {
            paginationControls.push(<FieldPaginationButton key={key++} text={`${totalPages - 1}`} onClick={ () => setCurrentPage(totalPages - 1) } />);
        } else if (currentPage < totalPages - 4) {
            paginationControls.push(<FieldPaginationGap key={key++} />);
        }

        paginationControls.push(<FieldPaginationButton key={key++} text={`${totalPages}`} onClick={ () => setCurrentPage(totalPages) } />);
        paginationControls.push(<FieldPaginationButton key={key++} text={"Next"} onClick={ () => setCurrentPage(Math.min(currentPage + 1, totalPages)) } />);

        return (
            <div className="field-pagination">
                {paginationControls}
            </div>
        );
    }
}

export default FieldPagination;