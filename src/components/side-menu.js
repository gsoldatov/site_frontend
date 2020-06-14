import React from "react";
import SideMenuItemContainer from "./side-menu-item-container";


class SideMenu extends React.Component {
    render() {
        const itemList = this.props.itemList ? this.props.itemList : "no menu items available";
        return (
            <aside>
                {itemList}
            </aside>
        );
    }
}

export default SideMenu;



// import React from "react";
// import factory from "./side-menu-item-container-factory";


// class SideMenu extends React.Component {
//     render() {
//         let k = 0;
//         const itemList = this.props.itemList
//                         ? this.props.itemList.map(item => {
//                             let SideMenuItemContainer = factory(item.itemJSX, item.isVisible, item.isActive, item.onClick);
//                             return <SideMenuItemContainer key={k++} />;
//                         })
//                         : "no menu items available";
//         return (
//             <aside>
//                 {itemList}
//             </aside>
//         );
//     }
// }

// export default SideMenu;