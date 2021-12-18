import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router";

import { setRedirectOnRender } from "../../actions/common";


/**
 * Wrapper component, which monitors `state.redirectOnRender` and redirects to the specified URL, when it's provided.
 * If `state.redirectOnRender` is empty, renders its children.
 */
export const RedirectOnRenderWrapper = ({ children }) => {
    const dispatch = useDispatch();
    const redirectOnRender = useSelector(state => state.redirectOnRender);
    
    useEffect(() => {
        if (redirectOnRender) dispatch(setRedirectOnRender(""));
    }, [redirectOnRender]);

    if (redirectOnRender.length > 0) return <Redirect to={redirectOnRender} />;

    return children;
};
