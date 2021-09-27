import React from "react";

import Layout from "../common/layout";


/**
 * Index page component.
 */
export const IndexPage = () => {
    const body = (
        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}>Index page</div>
    );

    return <Layout body={body} />;
};
