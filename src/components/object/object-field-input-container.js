import { connect } from "react-redux";
import ObjectFieldInput from "./object-field-input";

/*
    <ObjectFieldInput> wrapper for connecting to the store.

    Props:
    * getName - function which returns current object/tag name;
    * getDescription - function which returns current object/tag description.
*/

const mapStateToProps = (state, ownProps) => {
    const getName  = ownProps.getName;
    const getDescription  = ownProps.getDescription;

    return {
        name: getName === undefined ? undefined : getName(state),
        description: getDescription === undefined ? undefined : getDescription(state)
    };
};

const ObjectFieldInputContainer = connect(mapStateToProps, null)(ObjectFieldInput);

export default ObjectFieldInputContainer;
