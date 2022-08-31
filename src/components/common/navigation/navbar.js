import React, { memo, useMemo, useState, useEffect, useRef } from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { OnResizeWrapper } from "../on-resize-wrapper";
import { NavbarSecondaryMenu } from "./secondary-menu";
import { NavbarItem } from "./menu-item";
import { NavbarSubmenu, NavbarSubmenuItem } from "./submenu";
import { NavbarSearch } from "./search";

import { enumUserLevels } from "../../../util/enum-user-levels";

import StyleNavigation from "../../../styles/navigation.css";


/**
 * Navigation bar top-level component.
 */
export const Navbar = memo(() => {
    const placeholderRef = useRef();
    const location = useLocation();

    // Stacked menu expand/collapse control display
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);    // SUIR @media threshold
    const [isExpanded, setIsExpanded] = useState(false);

    // Navbar placeholder height
    const [placeholderHeight, setPlaceholderHeight] = useState(0);

    // Resize callback
    const onResizeCallback = useMemo(() => navbar => {
        if (navbar) {
            // Update `isStacked` prop
            const computedStyle = getComputedStyle(navbar);
            const width = parseInt(computedStyle.width.replace("px", ""));
            const newIsStacked = width < 768;   // SUIR @media threshold
            setIsStacked(newIsStacked);

            // Update placeholder height
            const newNavbarHeight = parseInt(computedStyle.height.replace("px", ""));
            if (placeholderHeight !== newNavbarHeight) setPlaceholderHeight(newNavbarHeight);
        }
    }, [isStacked, placeholderHeight]);

    // Update placeholder height after first render
    useEffect(() => {
        if (isStacked && placeholderRef.current) {
            const navbar = placeholderRef.current.parentNode.querySelector(".navigation-bar");
            const newNavbarHeight = parseInt(getComputedStyle(navbar).height.replace("px", ""));
            if (placeholderHeight !== newNavbarHeight) setPlaceholderHeight(newNavbarHeight);
        }
    }, []);

    // CSS classnames
    const placeholderClassName = "navigation-bar-placeholder" + (isStacked ? " is-stacked" : "");
    const placeholerStyle = { height: placeholderHeight };
    const mainMenuClassname = "navigation-bar" + (isStacked ? " is-stacked" : "");

    // Menu items props
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin);
    const menuItemsAreVisible = !isStacked || isExpanded;
    const loggedInAndVisible = menuItemsAreVisible && isLoggedIn;
    const loggedInAsAdminAndVisible = menuItemsAreVisible && isLoggedInAsAdmin;

    const editedObjectsLabelText = useSelector(state => Object.keys(state.editedObjects).length || null);
    
    /* 
        Menu position is fixed to take 100% of screen width, `navigation-bar-placeholder` takes menu's positon in the flow

        `vertical` <Menu> prop is used instead of `stackable` prop of <Menu> to avoid inconsistency when when displaying composite object page
        (small viewport width forces navbar to be stackable even body width is > 768px) 
    */
    return (
        <div className="navigation-bar-container">
            <div ref={placeholderRef} className={placeholderClassName} style={placeholerStyle} />
            <OnResizeWrapper callback={onResizeCallback}>
                <Menu fluid vertical={isStacked} size="large" className={mainMenuClassname}
                    activeIndex={location.pathname}>
                    
                    <ExpandToggle isStacked={isStacked} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
                    
                    <NavbarItem isDisplayed={menuItemsAreVisible} text="Index" url="/" />

                    <NavbarSubmenu isDisplayed={loggedInAndVisible} isStacked={isStacked} text="Objects">
                        <NavbarSubmenuItem text="List" url="/objects/list" isStacked={isStacked} />
                        <NavbarSubmenuItem text="Edited Objects" url="/objects/edited" labelText={editedObjectsLabelText} labelColor="green" isStacked={isStacked} />
                    </NavbarSubmenu>
                    
                    <NavbarItem isDisplayed={menuItemsAreVisible} text="Tags" url="/tags/list" />
                    <NavbarItem isDisplayed={loggedInAsAdminAndVisible} text="Admin Page" url="/admin" />

                    <NavbarSearch isStacked={isStacked} />
                    <NavbarSecondaryMenu isStacked={isStacked} isExpanded={isExpanded} />
                </Menu>
            </OnResizeWrapper>
        </div>
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
