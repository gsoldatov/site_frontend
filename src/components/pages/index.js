import React from "react";
import { Redirect, useParams } from "react-router";

import { Layout } from "../modules/layout/layout";
import { ObjectsFeed } from "../page-parts/index/objects-feed";

import { enumLayoutTypes } from "../../util/enum-layout-types";


/**
 * Index page component.
 */
export const IndexPage = () => {
    // Get current page of objects feed from URL param
    let { page } = useParams();
    if (page !== undefined) {
        // Redirect in case of an invalid page value
        page = parseInt(page);
        if (isNaN(page) || page < 1) return <Redirect to="/" />;
    } else page = 1;

    const body = <ObjectsFeed page={page} />;

    return <Layout body={body} layoutType={enumLayoutTypes.shortWidth} />;
};
