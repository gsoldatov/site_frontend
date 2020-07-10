import { connect } from "react-redux";
import FieldItem from "./field-item";

/*
    FieldItem wrapper for connecting to the store.

    Props: 
    * itemID - id of the item (tag_id, object_id, etc.);
    * getText - function, which gets the text for provided itemID from the state;
    * getIsSelected - function, which defines if this item is selected based on the state of the item with provided itemID;
    * onClickRedirectURL - URL to redirect to on item click;
    * onCheckActionCreator - action creator which is called on item check with itemID as an argument.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        text: ownProps.getText(state, ownProps.itemID),
        // isSelected: ownProps.isSelected,
        isSelected: ownProps.getIsSelected(state, ownProps.itemID),
        onClickRedirectURL: ownProps.onClickRedirectURL
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onCheck: () => dispatch(ownProps.onCheckActionCreator(ownProps.itemID))
    };
};

const FieldItemContainer = connect(mapStateToProps, mapDispatchToProps)(FieldItem);

export default FieldItemContainer;
