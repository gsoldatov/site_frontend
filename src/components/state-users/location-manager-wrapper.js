import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect, useLocation } from "react-router";

import { setRedirectOnRender } from "../../reducers/common";
import { setModalImage } from "../../reducers/ui/modal";

import { getModalUIState } from "../../types/store/ui/modal";
import { clearUnchangedEditedObjects } from "../../reducers/data/edited-objects";


/**
 * Wrapper component for managing redirects set in `state.redirectOnRender` & dispatching state updates based on URL changes.
 */
export const LocationManagerWrapper = ({ children }) => {
    const dispatch = useDispatch();
    const redirectOnRender = useSelector(state => state.redirectOnRender);
    const previousLocation = useRef(null);
    const currentLocation = useLocation();

    // Run through location change handlers
    useEffect(() => {
        if (previousLocation.current !== null) {
            // Reset modal window's state after a redirect
            const newModal = getModalUIState();
            dispatch(setModalImage(newModal.image));

            // Clear unchanged edited objects when leaving /objects/edit/:id (both new & existing cases)
            if (previousLocation.current.pathname.startsWith("/objects/edit/")) {
                // Previous object ID
                const previousID = previousLocation.current.pathname.replace(/^\/objects\/edit\//g, "").replace(/\/$/g, "");
                const previousEditedObjectID = previousID === "new" ? 0 : parseInt(previousID);

                // Exclude current object ID and its subobjects, if /objects/edit/:id page is displayed for another object
                let currentEditedObjectID = undefined;                
                if (currentLocation.pathname.startsWith("/objects/edit/")) {
                    const currentID = currentLocation.pathname.replace(/^\/objects\/edit\//g, "").replace(/\/$/g, "");
                    currentEditedObjectID = currentID === "new" ? 0 : parseInt(currentID);
                }

                // Dispatch action
                dispatch(clearUnchangedEditedObjects(previousEditedObjectID, currentEditedObjectID));
            }
        }

        // Update `previousLocation` ref
        previousLocation.current = currentLocation;
    }, [currentLocation]);
    
    // Clear state.redirectOnRender after a redirect
    useEffect(() => {
        if (redirectOnRender) dispatch(setRedirectOnRender(""));
    }, [redirectOnRender]);

    // Redirect
    if (redirectOnRender.length > 0) return <Redirect to={redirectOnRender} />;

    // Render children
    return children;
};
