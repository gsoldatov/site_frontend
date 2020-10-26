import { connect } from "react-redux";
import ObjectTypeSelector from "./object-type-selector";
import { setCurrentObject } from "../../actions/object";

/*
    <ObjectTypeSelector> wrapper for connecting to the store.

    Props:
    * readOnly - boolean indicating if object type can be changed.
*/

const mapStateToProps = (state, ownProps) => {
    return {
        type: state.objectUI.currentObject.object_type,
        disabled: ownProps.disabled
    };
};

const mapDispatchToProps = dispatch => {
    return {
        changeCallback: componentState => dispatch(setCurrentObject({ object_type: componentState.type }))
    };
};

const ObjectTypeSelectorContainer = connect(mapStateToProps, mapDispatchToProps)(ObjectTypeSelector);

export default ObjectTypeSelectorContainer;
