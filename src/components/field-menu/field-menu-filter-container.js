import { connect } from "react-redux";
import FieldMenuFilter from "./field-menu-filter";

/*
    FieldMenuButton wrapper for connecting to the store.

    Props:
    * placeholder - text displayed as a placeholder;
    * getOnChangeParams - function which gets params to be passed into filter on change handler;
    * getText - function which gets current text of the items from the app's state;
    * onChange - filter on change handler function.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        placeholder: ownProps.placeholder,
        getOnChangeParams: ownProps.getOnChangeParams,
        text: ownProps.getText(state)
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onChange: params => dispatch(params instanceof Array ? ownProps.onChange(...params)
                                : typeof(params) === "object" ?  ownProps.onChange(params) : ownProps.onChange())
    };
};

const FieldMenuFilterContainer = connect(mapStateToProps, mapDispatchToProps)(FieldMenuFilter);

export default FieldMenuFilterContainer;
