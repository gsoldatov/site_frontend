import React, { memo, useContext, useMemo, useState } from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useSelector } from "react-redux";

import { OnResizeWrapper } from "../../modules/wrappers/on-resize-wrapper";
import { NavbarSecondaryMenu } from "./secondary-menu";
import { NavbarItem } from "./menu-item";
import { NavbarSubmenu, NavbarSubmenuItem } from "./submenu";
import { NavbarSearch } from "./search";

import { WindowWidthContext } from "../../modules/wrappers/window-width-provider";
import { NumericUserLevel } from "../../../types/store/data/auth";

import StyleNavigation from "../../../styles/modules/navigation.css";


/**
 * Navigation bar top-level component.
 */
export const Navbar = memo(({ usePlaceholder }) => {
    // Stacked menu expand/collapse control display
    const isStacked = useContext(WindowWidthContext) === 0;
    // const [isStacked, setIsStacked] = useState(window.innerWidth < 768);    // SUIR @media threshold
    const [isExpanded, setIsExpanded] = useState(false);

    // Navbar height state
    const [height, setHeight] = useState(0);

    // On resize callback
    const onResizeCallback = useMemo(() => navbar => {
        // Update navbar height state
        const height = parseInt(getComputedStyle(navbar).height.replace("px", ""));
        setHeight(height);
    }, []);

    // CSS classnames
    const mainMenuClassname = "navigation-bar" + (isStacked ? " is-stacked" : "");

    // Menu items props
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > NumericUserLevel.anonymous);
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === NumericUserLevel.admin);
    const menuItemsAreVisible = !isStacked || isExpanded;
    const loggedInAndVisible = menuItemsAreVisible && isLoggedIn;
    const loggedInAsAdminAndVisible = menuItemsAreVisible && isLoggedInAsAdmin;

    const editedObjectsLabelText = useSelector(state => Object.keys(state.editedObjects).length || null);
    
    /*
        `vertical` <Menu> prop is used instead of `stackable` prop of <Menu> to avoid inconsistency when when displaying composite object page
        (small viewport width forces navbar to be stackable even body width is > 768px) 
    */
    return (
        <>
            <NavbarFlowPlaceholder usePlaceholder={usePlaceholder} height={height} isStacked={isStacked} />
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
        </>
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


/**
 * Navbar flow placeholder
 * (rendered when layout with unlimited witdh is used (NOTE: regardless of navbar being stacked)
 * in this case navbar's position is set to `fixed` & placeholder must take its place)
 */
const NavbarFlowPlaceholder = memo(({ usePlaceholder, height }) => {
    if (!usePlaceholder) return null;
    
    const style = { height };
    return (
        <div className="navigation-bar-placeholder" style={style} />
    );
});
