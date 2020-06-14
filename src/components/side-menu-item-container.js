import { connect } from "react-redux";
import SideMenuItem from "./side-menu-item";

/*
    Factory for producing side menu item containers.
    
    Input: 
    * itemJSX - string, JSX or a function which accepts app state and returns JSX to be displayed inside the menu item;
    * isVisible - a boolean or a fucntion which accepts app state and returns bool value indicating if the item is displayed in the list;
    * isActive - a boolean or a function which accepts app state and returns bool value indicating if the item is active (can be clicked on);
    * onClick - Redux action to be dispatched on item click.
    
    Output:
        SideMenuItemContainer component, connected to the store.
*/

const itemJSXNonCallableTypes = ["string", "object"];

const mapStateToProps = (state, ownProps) => {
    return {
        itemJSX: itemJSXNonCallableTypes.includes(typeof(ownProps.itemJSX)) ? ownProps.itemJSX : ownProps.itemJSX(state),
        isVisible: typeof(ownProps.isVisible) === "boolean" ? ownProps.isVisible : ownProps.isVisible(state),
        isActive: typeof(ownProps.isActive) === "boolean" ? ownProps.isActive : ownProps.isActive(state)
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: () => { dispatch(ownProps.onClick); }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SideMenuItem);
