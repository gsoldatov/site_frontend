import React from "react";
import { useSelector } from "react-redux";

import { enumCompositeObjectDisplayModes } from "../../../util/enums/enum-composite-object-display-modes";

import { ObjectsViewCard } from "./objects-view-card";

import StyleObjectsViewRootCard from "../../../styles/pages/objects-view/root-card.css";


/**
 * Wrapper component for <ObjectsViewCard> with specific settings for root object card.
 */
export const ObjectsViewRootCard = ({ objectID }) => {
    const compositeDisplayMode = useSelector(state => (state.composite[objectID] || {}).display_mode);

    // Add card borders if object is not a multicolumn composite
    const classNames = ["root"];
    if (compositeDisplayMode !== enumCompositeObjectDisplayModes.multicolumn.value) classNames.push("bordered");

    const attributeProps = {
        // Don't display attributes for composite with "chapters" display mode
        displayAttributes: compositeDisplayMode !== enumCompositeObjectDisplayModes.chapters.value,

        // Don't display "View Object" button
        headerProps: {
            displayViewButton: false
        }
    };

    return <ObjectsViewCard objectID={objectID} classNames={classNames} attributeProps={attributeProps} />;
};
