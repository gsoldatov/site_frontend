import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import { enumCompositeObjectDisplayModes } from "../../util/enum-composite-object-display-modes";

import Layout from "../common/layout";
import { ObjectsViewCard } from "../view/objects-view-card";



/**
    /objects/view/:id page component.
*/
export const ObjectsView = () => {
    const { id } = useParams();

    const multicolumnLayout = useSelector(state => (state.composite[id] || {}).display_mode === enumCompositeObjectDisplayModes.multicolumn.value);
    const layoutClassName = multicolumnLayout ? "objects-view-page-multicolumn-composite" : "";

    const body = (
        <div className="objects-view-container">
            <ObjectsViewCard objectID={id} isMulticolumnComposite={multicolumnLayout} />
        </div>
    );

    return <Layout body={body} fullWidthMainContent={multicolumnLayout} className={layoutClassName} />;
};
