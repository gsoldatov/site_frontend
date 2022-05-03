import React, { memo, useMemo, useState, useEffect, useRef } from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useLocation } from "react-router-dom";

import { OnResizeWrapper } from "../on-resize-wrapper";
import { NavbarSecondaryMenu } from "./secondary-menu";
import { NavbarItem } from "./menu-item";

import { enumUserLevels } from "../../../util/enum-user-levels";

import StyleNavigation from "../../../styles/navigation.css";


/**
 * Navigation bar item description
 */
const navigationItems = [
    { to: "/", text: "Index" },
    { to: "/objects/list", text: "Objects", 
        isDisplayedSelector: state => state.auth.numeric_user_level > enumUserLevels.anonymous },
    { to: "/objects/edited", text: "Edited Objects", 
        labelTextSelector: state => Object.keys(state.editedObjects).length || undefined, 
        labelColorSelector: state => Object.keys(state.editedObjects).length > 0 ? "green" : "grey",
        isDisplayedSelector: state => state.auth.numeric_user_level > enumUserLevels.anonymous },
    { to: "/tags", text: "Tags",
        isDisplayedSelector: state => state.auth.numeric_user_level > enumUserLevels.anonymous },
    { to: "/admin", text: "Admin Page",
        isDisplayedSelector: state => state.auth.numeric_user_level === enumUserLevels.admin }
]

/**
 * Navigation menu.
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

    const expandToggle = useMemo(() => {
        const icon = isExpanded ? "close" : "bars";
        return (
            !isStacked ? null : (
                <Menu.Item className="navigation-bar-expand-container">
                    <Icon className="navigation-bar-expand-toggle" name={icon} onClick={() => setIsExpanded(!isExpanded)}/>
                </Menu.Item>
            )
        );
    }, [isExpanded, isStacked]);

    // Menu items
    const rightMenuClassName = "navigation-right-menu" + (
        isStacked ? " is-stacked" : ""  // add a top-border when menu is vertical (instead of pseudo-elements displayed before other menu items)
    );

    let menuItems;
    if (!isStacked || isExpanded) {
        menuItems = navigationItems.map((item, k) => <NavbarItem key={k} item={item} />);

        menuItems.push(<NavbarSecondaryMenu key={-1} containerClassName={rightMenuClassName} />);
    }

    const placeholderClassName = "navigation-bar-placeholder" + (isStacked ? " is-stacked" : "");
    const placeholerStyle = { height: placeholderHeight };
    const mainMenuClassname = "navigation-bar" + (isStacked ? " is-stacked" : "");
    
    /* 
        Menu position is fixed to take 100% of screen width, `navigation-bar-placeholder` takes menu's positon in the flow

        `vertical` <Menu> prop is used instead of `stackable` prop of <Menu> to avoid inconsistency when when displaying composite object page
        (small viewport width forces navbar to be stackable even body width is > 768px) 
    */
    return (
        <>
            <div ref={placeholderRef} className={placeholderClassName} style={placeholerStyle} />
            <OnResizeWrapper callback={onResizeCallback}>
                <Menu inverted fluid vertical={isStacked} size="large" className={mainMenuClassname}
                    activeIndex={location.pathname}>
                    {expandToggle}
                    {menuItems}
                </Menu>
            </OnResizeWrapper>
        </>
    );
});
