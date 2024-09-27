import React, { memo, useMemo, useState } from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useSelector } from "react-redux";

import { OnResizeWrapper } from "../../common/on-resize-wrapper";
import { NavbarSecondaryMenu } from "./secondary-menu";
import { NavbarItem } from "./menu-item";
import { NavbarSubmenu, NavbarSubmenuItem } from "./submenu";
import { NavbarSearch } from "./search";

import { enumUserLevels } from "../../../util/enum-user-levels";

import StyleNavigation from "../../../styles/modules/navigation.css";


/**
 * Navigation bar top-level component.
 */
export const Navbar = memo(() => {
    // Stacked menu expand/collapse control display
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);    // SUIR @media threshold
    const [isExpanded, setIsExpanded] = useState(false);

    // Resize callback
    const onResizeCallback = useMemo(() => navbar => {
        if (navbar) {
            // Update `isStacked` prop
            const computedStyle = getComputedStyle(navbar);
            const width = parseInt(computedStyle.width.replace("px", ""));
            const newIsStacked = width < 768;   // SUIR @media threshold
            setIsStacked(newIsStacked);
        }
    }, [isStacked]);

    // CSS classnames
    const mainMenuClassname = "navigation-bar" + (isStacked ? " is-stacked" : "");

    // Menu items props
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin);
    const menuItemsAreVisible = !isStacked || isExpanded;
    const loggedInAndVisible = menuItemsAreVisible && isLoggedIn;
    const loggedInAsAdminAndVisible = menuItemsAreVisible && isLoggedInAsAdmin;

    const editedObjectsLabelText = useSelector(state => Object.keys(state.editedObjects).length || null);
    
    /*
        `vertical` <Menu> prop is used instead of `stackable` prop of <Menu> to avoid inconsistency when when displaying composite object page
        (small viewport width forces navbar to be stackable even body width is > 768px) 
    */
    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <Menu fluid vertical={isStacked} size="large" className={mainMenuClassname} activeIndex={location.pathname}>
                <ExpandToggle isStacked={isStacked} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
                
                <NavbarItem isDisplayed={menuItemsAreVisible} text="Index" url="/" />

                <NavbarSubmenu isDisplayed={loggedInAndVisible} isStacked={isStacked} text="Objects">
                    <NavbarSubmenuItem text="New" url="/objects/edit/new" isStacked={isStacked} />
                    <NavbarSubmenuItem text="List" url="/objects/list" isStacked={isStacked} />
                    <NavbarSubmenuItem text="Edited Objects" url="/objects/edited" labelText={editedObjectsLabelText} labelColor="green" isStacked={isStacked} />
                </NavbarSubmenu>
                
                <NavbarItem isDisplayed={menuItemsAreVisible} text="Tags" url="/tags/list" />
                <NavbarItem isDisplayed={loggedInAsAdminAndVisible} text="Admin Page" url="/admin" />

                <NavbarSearch isStacked={isStacked} />
                <NavbarSecondaryMenu isStacked={isStacked} isExpanded={isExpanded} />
            </Menu>
        </OnResizeWrapper>
    );
});


/**
 * Expand control for stacked navbar
 */
const ExpandToggle = memo(({ isStacked, isExpanded, setIsExpanded }) => {
    if (!isStacked) return null;

    const icon = isExpanded ? "close" : "bars";

    return (
        <Menu.Item className="navigation-bar-expand-container">
            <Icon className="navigation-bar-expand-toggle" name={icon} onClick={() => setIsExpanded(!isExpanded)}/>
        </Menu.Item>
    );
});
