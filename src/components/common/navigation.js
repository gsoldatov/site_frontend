import React, { useEffect, useMemo, useState } from "react";
import { Button, Icon, Menu } from "semantic-ui-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { OnResizeWrapper } from "./on-resize-wrapper";

import StyleNavigation from "../../styles/navigation.css";


/**
 * Navigation bar.
 */
export default ({ }) => {
    const location = useLocation();

    // Stacked menu expand/collapse control display
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);    // SUIR @media threshold
    const [isExpanded, setIsExpanded] = useState(false);

    const onResizeCallback = useMemo(() => computedStyle => {
        const width = parseInt(computedStyle.width.replace("px", ""));
        setIsStacked(width < 768);     // SUIR @media threshold
    });

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

    const menuItems = (!isStacked || isExpanded) && (   // displayed when menu is not stacked or stacked and expanded
        <>
            <Menu.Item as={NavLink} exact to="/">Index</Menu.Item>
            <Menu.Item as={NavLink} exact to="/objects">Objects</Menu.Item>
            <Menu.Item as={NavLink} exact to="/tags">Tags</Menu.Item>

            <Menu.Menu position="right" className={rightMenuClassName}>
                <Menu.Item className="nagivation-bar-button-container">
                    <Button className="navigation-bar-button" color="blue">Login</Button>
                    <Button className="navigation-bar-button" color="teal">Sign Up</Button>
                </Menu.Item>
            </Menu.Menu>
        </>
    );
    
    // `vertical` <Menu> prop is used instead of `stackable` prop of <Menu> to avoid inconsistency when when displaying composite object page
    // (small viewport width forces navbar to be stackable even body width is > 768px)
    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <Menu inverted fluid vertical={isStacked} size="large" className="navigation-bar"
                activeIndex={location.pathname}
            >
                {expandToggle}
                {menuItems}
            </Menu>
        </OnResizeWrapper>
    );
};
