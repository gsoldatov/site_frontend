import React from "react";

/*
    Component which renders an interactable item in a SideMenuDialog instance.
    SideMenuItemContainer should be used instead of this class to connect it to the state.
*/
class SideMenuItem extends React.Component {
    render() {
        if (!this.props.isVisible) {
            return null;
        }
        
        const className = this.props.isActive ? "side-menu-item" : "side-menu-item-inactive";
        const onClick = this.props.isActive ? this.props.onClick : null;

        return (
            <div className={className} onClick={onClick}>
                {this.props.itemJSX}
            </div>
        );
    }
}

export default SideMenuItem;