import { connect } from "react-redux";
import FieldItem from "./field-item";

const mapStateToProps = (state, ownProps) => {
    return {
        text: ownProps.getText(state, ownProps.tag_id),
        // isSelected: ownProps.isSelected,
        isSelected: ownProps.getIsSelected(state, ownProps.tag_id),
        onClickRedirectURL: ownProps.onClickRedirectURL
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onCheck: () => dispatch(ownProps.onCheckActionCreator(ownProps.tag_id))
    };
};

const FieldItemContainer = connect(mapStateToProps, mapDispatchToProps)(FieldItem);

export default FieldItemContainer;
