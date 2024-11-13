import React from "react";
import { Link } from "react-router-dom";
import { Header } from "semantic-ui-react";

import { Layout } from "../modules/layout/layout";

import { LayoutType } from "../../store/types/ui/general/layout-type";


/**
 * Not found page component.
 */
export const NotFoundPage = () => {
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

    return <Layout body={body} layoutType={LayoutType.shortWidth} />;
};
