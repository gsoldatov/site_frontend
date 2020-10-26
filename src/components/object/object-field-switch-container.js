import { connect } from "react-redux";
import ObjectFieldSwitch from "./object-field-switch";

/*
    <ObjectFieldSwitch> wrapper for connecting to the store.
*/

const mapStateToProps = (state, ownProps) => {
    return {
        type: state.objectUI.currentObject.object_type
    };
};

const ObjectFieldSwitchContainer = connect(mapStateToProps, null)(ObjectFieldSwitch);

export default ObjectFieldSwitchContainer;
