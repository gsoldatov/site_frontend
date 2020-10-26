import { connect } from "react-redux";
import LinkInput from "./link-input";
import { setCurrentObject } from "../../actions/object";

/*
    <LinkInput> wrapper for connecting to the store.
*/

const mapStateToProps = (state, ownProps) => {
    return {
        link: state.objectUI.currentObject.link
    };
};

const mapDispatchToProps = dispatch => {
    return {
        changeCallback: componentState => dispatch(setCurrentObject({ link: componentState.link }))
    };
};

const LinkInputContainer = connect(mapStateToProps, mapDispatchToProps)(LinkInput);

export default LinkInputContainer;
