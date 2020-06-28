import { connect } from "react-redux";
import FieldPagination from "./field-pagination";

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
