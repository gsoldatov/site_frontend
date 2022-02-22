import React, { memo, useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Icon, Label, Menu } from "semantic-ui-react";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";

import { OnResizeWrapper } from "./on-resize-wrapper";

import { registrationStatusFetch, logoutFetch, getCurrentUserData } from "../../fetches/auth";

import { enumUserLevels } from "../../util/enum-user-levels";
import { useMountedState } from "../../util/use-mounted-state";

import StyleNavigation from "../../styles/navigation.css";


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
 * Navigation bar.
 */
export default memo(() => {
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


/**
 * Navigation bar's item component.
 */
const NavbarItem = ({ item }) => {
    const isDisplayed = useSelector(item.isDisplayedSelector || (state => true));
    const labelText = useSelector(item.labelTextSelector || (state => undefined));
    const labelColor = useSelector(item.labelColorSelector || (state => "grey"));
    if (!isDisplayed) return null;

    const label = labelText !== undefined ? <Label size="tiny" circular color={labelColor}>{labelText}</Label> : null;

    return (
        <Menu.Item as={NavLink} exact to={item.to}>
            {item.text}
            {label}
        </Menu.Item>
    );
};


/**
 * Navigation bar's secondary menu component with auth controls.
 */
const NavbarSecondaryMenu = ({ containerClassName }) => {
    const isUserLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);

    const location = useLocation();
    const isMenuDisplayed = location.pathname.startsWith("/auth/") === false;

    if (!isMenuDisplayed) return null;
    
    const content = isUserLoggedIn ? <LoggedInSecondaryMenu /> : <LoggedOutSecondaryMenu />;
    
    return (
        <Menu.Menu position="right" className={containerClassName}>
            {content}
        </Menu.Menu>
    );
};


/**
 * Navbar's secondary menu content for anonymous users.
 */
const LoggedOutSecondaryMenu = () => {
    const history = useHistory();
    const location = useLocation();
    const dispatch = useDispatch();
    const isMounted = useMountedState();

    // Login button
    const loginOnClick = useMemo(() => () => {
        let query = new URLSearchParams();
        query.append("from", location.pathname);
        history.push(`/auth/login?${query.toString()}`);
    }, [location]);

    // Sign up button is disabled by default. After first render, a fetch is run to check if registration is enabled.
    // If yes, registration button becomes available.
    const [isSignUpEnabled, setIsSignUpEnabled] = useState(false);
    useEffect(() => {
        const updateSignUpEnabled = async () => {
            const result = await dispatch(registrationStatusFetch());
            if (isMounted()) setIsSignUpEnabled(result);
        };
        updateSignUpEnabled();
    }, []);

    const signUpOnClick = useMemo(() => {
        return isSignUpEnabled ? () => history.push("/auth/register") : undefined
    }, [isSignUpEnabled]);
    const signUpClassName = "navigation-bar-button" + (isSignUpEnabled ? "" : " is-disabled")
    const signUpTitle = isSignUpEnabled ? "" : "Registration is currently unavailable.";
    const signUpColor = "teal";  // overriden by CSS rules for disabled button

    return (
        <Menu.Item className="nagivation-bar-button-container">
            <Button className="navigation-bar-button" color="blue" onClick={loginOnClick}>Login</Button>
            <Button className={signUpClassName} color={signUpColor} onClick={signUpOnClick} title={signUpTitle}>
                Sign Up
            </Button>
        </Menu.Item>
    );
};


/**
 * Navbar's secondary menu content for anonymous users.
 */
const LoggedInSecondaryMenu = () => {
    const dispatch = useDispatch();

    // Ensure user information is in the state
    useEffect(() => {
        dispatch(getCurrentUserData());
    }, []);

    // User params
    const userPageLink = "/users/" + useSelector(state => state.auth.user_id);
    const username = useSelector(state => state.auth.user_id in state.users ? state.users[state.auth.user_id].username : "");

    // Logout button
    const logoutOnClick = useMemo(() => () => {
        dispatch(logoutFetch());
    });
    
    return (
        <Menu.Item className="nagivation-bar-button-container">
            <Link className="navigation-bar-username" to={userPageLink}>{username}</Link>
            <Button className="navigation-bar-button" color="teal" onClick={logoutOnClick}>
                Logout
            </Button>
        </Menu.Item>
    );
};
