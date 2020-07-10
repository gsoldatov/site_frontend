import React from "react";

/*
    Component for rendering side menu with items passed as props.
*/
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
