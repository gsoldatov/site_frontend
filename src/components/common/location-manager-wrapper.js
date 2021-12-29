import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router";

import { setRedirectOnRender } from "../../actions/common";


/**
 * Wrapper component for managing redirects set in `state.redirectOnRender` & dispatching state updates based on URL changes.
 */
export const LocationManagerWrapper = ({ children }) => {
    const dispatch = useDispatch();
    const redirectOnRender = useSelector(state => state.redirectOnRender);
    
    // Clear state.redirectOnRender after a redirect
    useEffect(() => {
        if (redirectOnRender) dispatch(setRedirectOnRender(""));
    }, [redirectOnRender]);

    // Redirect
    if (redirectOnRender.length > 0) return <Redirect to={redirectOnRender} />;

    // Render children
    return children;
};
