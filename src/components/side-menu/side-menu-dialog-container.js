import { connect } from "react-redux";
import SideMenuDialog from "./side-menu-dialog";

/*
    SideMenuDialog wrapper for connecting to the store.

    Props: 
    * message - string to be displayed in the dialog;
    * isVisible - a boolean or a fucntion which accepts app state and returns bool value indicating if the item is displayed in the list;
    * buttons - list of SideMenuDialogButtonContainer elements.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        message: ownProps.message,
        isVisible: typeof(ownProps.isVisible) === "boolean" ? ownProps.isVisible : ownProps.isVisible(state),
        buttons: ownProps.buttons
    };
};

export default connect(mapStateToProps, null)(SideMenuDialog);
