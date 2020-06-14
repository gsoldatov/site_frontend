import { connect } from "react-redux";
import SideMenuDialogButton from "./side-menu-dialog-button";

/*
    Factory for producing side menu dialog button containers.
    
    Input: 
    * text - button text;
    * CSSClass - CSS class of the button (defaults to "side-menu-dialog-button");
    * onClick - Redux action to be dispatched on item click.

    Output:
        SideMenuButtonContainer component, connected to the store.
*/

const itemJSXNonCallableTypes = ["string", "object"];

const mapStateToProps = (state, ownProps) => {
    return {
        text: ownProps.text
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: () => { dispatch(ownProps.onClick); }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SideMenuDialogButton);
