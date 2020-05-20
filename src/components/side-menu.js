import React from "react";

class SideMenu extends React.Component {
    render() {
        return (
            <aside>
                <ul className="side-menu">
                    <li className="side-menu-item">Menu item 1</li>
                    <li className="side-menu-item">Menu item 2</li>
                    <li className="side-menu-item">Menu item 3</li>
                </ul>
            </aside>
        );
    }
}

export default SideMenu;