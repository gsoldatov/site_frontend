import React, { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Menu } from "semantic-ui-react";
import { Link, useHistory, useLocation } from "react-router-dom";

import { registrationStatusFetch, logoutFetch, getCurrentUserData } from "../../../fetches/auth";

import { enumUserLevels } from "../../../util/enum-user-levels";
import { useMountedState } from "../../../util/use-mounted-state";


/**
 * Navigation bar's secondary menu component with auth controls.
 */
export const NavbarSecondaryMenu = ({ isStacked, isExpanded }) => {
    const isUserLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);

    const location = useLocation();
    const isMenuDisplayed = (!isStacked || isExpanded) && location.pathname.startsWith("/auth/") === false;

    if (!isMenuDisplayed) return null;

    const containerClassName = "navigation-right-menu" + (
        isStacked ? " is-stacked" : ""  // add a top-border when menu is vertical (instead of pseudo-elements displayed before other menu items)
    );
    
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
            <Button className="navigation-bar-button" color="blue" onClick={loginOnClick}>Log In</Button>
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
            <Button className="navigation-bar-button" color="blue" onClick={logoutOnClick}>
                Log Out
            </Button>
        </Menu.Item>
    );
};
