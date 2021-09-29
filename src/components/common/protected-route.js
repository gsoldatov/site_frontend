import React from "react";
import { useSelector } from "react-redux";
import { Redirect, Route, useLocation } from "react-router";


/**
 * Wrapper for React Router `Route` component. Renders a `Route` with provided route component params wrapping `children` component(-s) 
 * if `childrenRenderedSelector` returns true or redirects to `fallbackRoute`.
 * If `addQueryString` is true, a query string with 'from' parameter will be added to `fallbackRoute` when redirecting.
 */
export const ProtectedRoute = ({ childrenRenderedSelector, fallbackRoute, addQueryString = false, children, ...rest }) => {
    const location = useLocation();
    const childrenRendered = useSelector(childrenRenderedSelector);

    // Redirect to fallback page if render condition is not met
    if (!childrenRendered) {
        let redirectTo = fallbackRoute;
        if (addQueryString) {   // optionally, add a query string with "from" param
            const searchParams = new URLSearchParams();
            searchParams.append("from", location.pathname);
            redirectTo += "?" + searchParams.toString();
        }
        children = <Redirect to={redirectTo} />;
    }

    return (
        <Route {...rest} >
            {children}
        </Route>
    );
};

    // - protected route wrapper: TODO remove
    //     - properties:
    //         - childrenRenderedSelector;
    //         - fallback route;
    //         - add from query string boolean;
    //         ? Router component properties;      // or render Router > ProtectedRouteWrapper > Component in App.js
    //     - if childrenRendered condition is not met, render `Redirect` component for fallback route:
    //         - optionally, adds "from" query string;
    //     - otherwise, render children;

    //     - protect components:
    //         - /auth/login, /auth/register => redirect to index if logged in;
    //         - all others, except for index => redirect to /auth/login?from=%location% if not logged in;
    //
    // - add ?from=%location.path% for login button in the navbar;
