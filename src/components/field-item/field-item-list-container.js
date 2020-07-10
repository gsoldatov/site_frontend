import React from "react";
import { connect } from "react-redux";

import FieldItemList from "./field-item-list";

/*
    FieldItemList wrapper for connecting to the store.

    Props:
    * itemFactory - function which returns a list of components to be rendered in the FieldItemList;
    * itemIDs - list of item IDs to be passed into itemFactory;
    * isFetching - boolean, which indicates if a message about fetch should be displayed instead of items;
    * fetchError - error text to be displayed instead of items;
    * isExpandable - boolean, which indicates if FieldItemList height should be limited by an expand/collapse element.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        items: ownProps.itemFactory(state, ownProps.itemIDs),
        isFetching: ownProps.isFetching,
        fetchError: ownProps.fetchError,
        isExpandable: ownProps.isExpandable
    };
};

const FieldItemListContainer = connect(mapStateToProps, null)(FieldItemList);

export default FieldItemListContainer;
