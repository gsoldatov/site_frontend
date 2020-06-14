import { connect } from "react-redux";
import SideMenuDialog from "./side-menu-dialog";

/*
    Factory for producing side menu dialog containers.
    
    Input: 
    * message - string to be displayed in the dialog;
    * isVisible - a boolean or a fucntion which accepts app state and returns bool value indicating if the item is displayed in the list;
    * buttons - list of SideMenuDialogButtonContainer elements;
    
    Output:
        SideMenuDialogContainer component, connected to the store.
*/

const itemJSXNonCallableTypes = ["string", "object"];

const mapStateToProps = (state, ownProps) => {
    return {
        message: ownProps.message,
        isVisible: typeof(ownProps.isVisible) === "boolean" ? ownProps.isVisible : ownProps.isVisible(state),
        buttons: ownProps.buttons
    };
};

// const mapDispatchToProps = (dispatch, ownProps) => {
//     return {
//         onClick: () => { dispatch(ownProps.onClick); }
//     };
// };

export default connect(mapStateToProps, null)(SideMenuDialog);
