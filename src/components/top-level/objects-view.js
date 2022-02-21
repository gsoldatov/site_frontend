import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import { enumCompositeObjectDisplayModes } from "../../util/enum-composite-object-display-modes";

import Layout from "../common/layout";
import { ObjectsViewCard } from "../view/objects-view-card";

import StyleRootObjectsViewCard from "../../styles/objects-view/root-card.css";

/**
    /objects/view/:id page component.
*/
export const ObjectsView = () => {
    const { id } = useParams();

    const multicolumnLayout = useSelector(state => (state.composite[id] || {}).display_mode === enumCompositeObjectDisplayModes.multicolumn.value);
    const layoutClassName = multicolumnLayout ? "objects-view-page-multicolumn-composite" : "";

    const body = (
        <div className="objects-view-container">
            <RootObjectsViewCard objectID={id} />
        </div>
    );

    return <Layout body={body} fullWidthMainContent={multicolumnLayout} className={layoutClassName} />;
};


/**
 * Wrapper component for <ObjectsViewCard> with specific settings for root object card.
 */
const RootObjectsViewCard = ({ objectID }) => {
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
