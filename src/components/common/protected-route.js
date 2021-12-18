import React from "react";
import { useSelector } from "react-redux";
import { Redirect, Route, useLocation } from "react-router";

import { setRedirectOnRender } from "../../actions/common";


/**
 * Wrapper for React Router `Route` component. Renders a `Route` with provided route component params wrapping `children` component(-s).
 * If state.redirectOnRender is set, redirects to the page specified in it.
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
        return <Redirect to={redirectTo} />;
    }

    // Wrap in <Route> component only if the child itself is not a <Route> or a <ProtectedRoute>
    // (to allow nested <ProtectedRoute> usage)
    let result = children;
    if (children.type !== Route && children.type !== ProtectedRoute) result = (
        <Route {...rest}>
            {result}
        </Route>
    )
    
    return result;
};
