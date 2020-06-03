import { connect } from "react-redux";
import SideMenuItem from "./side-menu-item";

/*
    Factory for producing side menu item containers.
    
    Input: 
    * itemJSX - item text and icons to be displayed inside the item;
    * getIsActive - function which accepts app state and returns bool value indicating if the item is active (can be clicked on);
    * onClick - function to be called on item click.
    
    Output:
        SideMenuItemContainer component, connected to the store.
*/
function sideMenuItemContainerFactory(itemJSX, getIsActive, onClick) {
    const mapStateToProps = (state, ownProps) => {
        return {
            itemJSX: itemJSX,
            isActive: getIsActive(state)
        };
    };

    const mapDispatchToProps = (dispatch, ownProps) => {
        return {
            onClick: () => { dispatch(onClick); }
        };
    };

    return connect(mapStateToProps, mapDispatchToProps)(SideMenuItem);
}

export default sideMenuItemContainerFactory;
