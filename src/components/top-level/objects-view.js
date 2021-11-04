import React from "react";
import { useParams } from "react-router";

import Layout from "../common/layout";
import { ObjectsViewCard } from "../view/objects-view-card";



/**
    /objects/view/:id page component.
*/
export const ObjectsView = () => {
    const { id } = useParams();

    const body = (
        <div className="objects-view-container">
            <ObjectsViewCard objectID={id} />
        </div>
    );

    return <Layout body={body} />;
};
