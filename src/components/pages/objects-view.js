import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import { enumCompositeObjectDisplayModes } from "../../util/enums/enum-composite-object-display-modes";

import { Layout } from "../modules/layout/layout";
import { ObjectsViewRootCard } from "../page-parts/objects-view/objects-view-root-card";

import { enumLayoutTypes } from "../../util/enums/enum-layout-types";


/**
    /objects/view/:id page component.
*/
export const ObjectsViewPage = () => {
    const { id } = useParams();

    const multicolumnLayout = useSelector(state => (state.composite[id] || {}).display_mode === enumCompositeObjectDisplayModes.multicolumn.value);

    const body = (
        <div className="objects-view-container">
            <ObjectsViewRootCard objectID={id} />
        </div>
    );

    // Set unlimited width for layout when displaying multicolumn composite objects
    const layoutType = multicolumnLayout ? enumLayoutTypes.unlimitedWidth : enumLayoutTypes.shortWidth;

    return <Layout body={body} layoutType={layoutType} />;
};
