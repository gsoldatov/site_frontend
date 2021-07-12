import React from "react";
import { Link } from "react-router-dom";
import { Header } from "semantic-ui-react";

import Layout from "./common/layout";


/**
 * Not found page component.
 */
export const NotFound = () => {
    const body = (
        <div className="not-found-container">
            <Header as="h1" className="not-found-header">
                Page not found.
            </Header>
            <div className="not-found-message">
                Click <Link to="/">here</Link> to return to main page.
            </div>
        </div>
    );

    return <Layout body={body} />;
};
