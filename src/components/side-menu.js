import React from "react";
import SideMenuItemContainer from "./side-menu-item-container";


class SideMenu extends React.Component {
    render() {
        const items = this.props.items ? this.props.items : "no menu items available";
        return (
            <aside>
                {items}
            </aside>
        );
    }
}

export default SideMenu;
