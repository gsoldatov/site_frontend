import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import { Layout } from "../modules/layout/layout";
import { ObjectsViewRootCard } from "../page-parts/objects-view/objects-view-root-card";

import { LayoutType } from "../../types/store/ui/general/layout-type";


/**
    /objects/view/:id page component.
*/
export const ObjectsViewPage = () => {
    const { id } = useParams();

    const multicolumnLayout = useSelector(state => (state.composite[id] || {}).display_mode === "multicolumn");

    const body = (
        <div className="objects-view-container">
            <ObjectsViewRootCard objectID={id} />
        </div>
    );

    // Set unlimited width for layout when displaying multicolumn composite objects
    const layoutType = multicolumnLayout ? LayoutType.unlimitedWidth : LayoutType.shortWidth;

    return <Layout body={body} layoutType={layoutType} />;
};
