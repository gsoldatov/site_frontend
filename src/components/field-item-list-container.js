import React from "react";
import { connect } from "react-redux";

import FieldItemList from "./field-item-list";
import FieldItemContainer from "./field-item-container";


const mapStateToProps = (state, ownProps) => {
    return {
        items: ownProps.itemFactory(state, ownProps.getItemIDs(state)),
        paginationFetch: ownProps.getPaginationFetch(state),
        collapseHeight: null            // TODO collapsing and expanding
    };
};

// const mapDispatchToProps = (dispatch, ownProps) => {
//     return {
//         // onCheck: () => { console.log("Checkbox toggled"); }
//     };
// };

const FieldItemListContainer = connect(mapStateToProps, null)(FieldItemList);

export default FieldItemListContainer;
