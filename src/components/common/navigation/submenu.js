import React, { memo, useState } from "react";
import { Dropdown, Label, Menu } from "semantic-ui-react";

import { NavbarItem } from "./menu-item";


/**
 * Submenu item of navigation bar.
 * 
 * In fullscreen mode renders a <Dropdown> with provided <NavbarSubmenuItem> chidlren.
 * In stacked mode renders a <Menu.Item> with a toggleable submenu and provided <NavbarSubmenuItem> submenu children.
 */
export const NavbarSubmenu = memo(({ isDisplayed, isStacked, text, children }) => {
    // Expanded state for the stacked case
    const [isExpanded, setIsExpanded] = useState(false);

    // Not displayed case
    if (!isDisplayed) return null;

    // Fullscreen case
    if (!isStacked) {
        return (
            <Dropdown item text={text}>
                <Dropdown.Menu className="navbar-submenu-dropdown">
                    {children}
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    // Stacked case
    const sumbenu = isExpanded && (
        <Menu.Menu className="navbar-submenu">
            {children}
        </Menu.Menu>
    );

    const containerClassName = "navbar-submenu-container"
        .concat(isExpanded ? " is-expanded" : "");

    return (
        <Menu.Item className={containerClassName}>
            <div className="navbar-submenu-header" onClick={() => setIsExpanded(!isExpanded)}>{text}</div>
            {sumbenu}
        </Menu.Item>
    );
});


/**
 * A single child item inside <NavbarSubmenu>.
 * 
 * Wraps <NavbarItem> and renders a <Dropdown> or <Menu> item based on whether it's stacked.
 */
export const NavbarSubmenuItem = ({ isStacked, ...props }) => {
    const renderAs = isStacked ? null : Dropdown.Item;

    return <NavbarItem renderAs={renderAs} {...props} />;
};


// - <NavbarSubmenuItem>:
//             - renders a single submenu item:
//             - accepts `isStacked` prop:
//                 - if not stacked, renders <NavbarItem> and passes remaining props into it;
//                 - if stacked, renders:
//                     ? <NavbarItem> as <Dropdown.Item>:
//                         - as NavLink works;
//                         - isDisplayed;
//                         - text is displayed correctly;
//                         - label & label text are displayed correctly;
//                     ? another component, acting like <NavbarItem>, but rendering a <Dropdown.Item>;

// - <NavbarSubmenu>:
//             - renders children on condition;
//             - different components based on `isStacked` prop:
//                 - if not stacked:
//                     - renders:
//                         - <Dropdown> with provided header text;
//                         - provided <NavbarSubmenuItem> children;
//                 - if stacked:
//                     - renders:
//                         - <Menu.Item>:
//                             - clickable text, which toggles item display on click;
//                             - if toggled:
//                                 - a <Menu.Menu>:
//                                     - list of provided <NavbarSubmenuItem> children;



// /**
//  * Basic navbar item with a link to another page.
//  */
// export const NavbarItem = memo(({ isDisplayed, text, url, labelText, labelColor }) => {
//     if (!isDisplayed) return null;

//     const label = labelText && <Label size="tiny" circular color={labelColor}>{labelText}</Label>;

//     return (
//         <Menu.Item as={NavLink} exact to={url}>
//             {text}
//             {label}
//         </Menu.Item>
//     );
// });
