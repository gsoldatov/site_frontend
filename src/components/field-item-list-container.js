import React from "react";
import { connect } from "react-redux";

import FieldItemList from "./field-item-list";
import FieldItemContainer from "./field-item-container";


const mapStateToProps = (state, ownProps) => {
    return {
        items: ownProps.itemFactory(state, ownProps.itemIDs),
        isFetching: ownProps.isFetching,
        fetchError: ownProps.fetchError,
        isExpandable: ownProps.isExpandable
    };
};

// const mapDispatchToProps = (dispatch, ownProps) => {
//     return {
//         // onCheck: () => { console.log("Checkbox toggled"); }
//     };
// };

const FieldItemListContainer = connect(mapStateToProps, null)(FieldItemList);

export default FieldItemListContainer;
