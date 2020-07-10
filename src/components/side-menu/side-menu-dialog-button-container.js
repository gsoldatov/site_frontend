import { connect } from "react-redux";
import SideMenuDialogButton from "./side-menu-dialog-button";

/*
    SideMenuDialogButton wrapper for connecting to the store.

    Props: 
    * text - button text;
    * CSSClass - CSS class of the button (defaults to "side-menu-dialog-button");
    * onClick - Redux action to be dispatched on item click.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        text: ownProps.text,
        CSSClass: ownProps.CSSClass
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: () => { dispatch(ownProps.onClick); }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SideMenuDialogButton);
