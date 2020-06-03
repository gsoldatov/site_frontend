import React from "react";
import factory from "./side-menu-item-container-factory";


class SideMenu extends React.Component {
    render() {
        let k = 0;
        const itemList = this.props.itemList
                        ? this.props.itemList.map(item => {
                            let SideMenuItemContainer = factory(item.itemJSX, item.getIsActive, item.onClick);
                            return <SideMenuItemContainer key={k++} />;
                        })
                        : "no menu items available";
        return (
            <aside>
                {itemList}
            </aside>
        );
    }
}

export default SideMenu;