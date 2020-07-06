import { connect } from "react-redux";
import FieldMenuFilter from "./field-menu-filter";

const mapStateToProps = (state, ownProps) => {
    return {
        placeholder: ownProps.placeholder,
        getOnChangeParams: ownProps.getOnChangeParams
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
