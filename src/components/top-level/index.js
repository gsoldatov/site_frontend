import React from "react";
import { Redirect, useParams } from "react-router";

import Layout from "../common/layout";
import { ObjectsFeed } from "../feed/objects-feed";


/**
 * Index page component.
 */
export const IndexPage = () => {
    console.log("IN INDEX PAGE RENDER")
    // Get current page of objects feed from URL param
    let { page } = useParams();
    if (page !== undefined) {
        // Redirect in case of an invalid page value
        page = parseInt(page);
        if (isNaN(page) || page < 1) return <Redirect to="/" />;
    } else page = 1;

    const body = (
        <ObjectsFeed page={page} />
    );

    return <Layout body={body} />;
};
