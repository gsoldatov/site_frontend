import { connect } from "react-redux";
import FieldPagination from "./field-pagination";

/*
    FieldPagination wrapper for connecting to the store.

    Props: 
    * paginationInfo - object containing current information about pagination (current page, total pages, sort field and direction, filter text, num of items per page);
    * setCurrentPage - function, which dispatches an action on a pagination button click and changes the page being displayed.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        paginationInfo: ownProps.paginationInfo
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        setCurrentPage: ownProps.setCurrentPage
    };
};

const FieldPaginationContainer = connect(mapStateToProps, mapDispatchToProps)(FieldPagination);

export default FieldPaginationContainer;
