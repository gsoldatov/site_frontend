import React from "react";
import { Link } from "react-router-dom";
import { Header } from "semantic-ui-react";


/*
    Default component, displayed when object data can't be displayed (no implementation or nested composite objects).
*/
export const DefaultObjectData = ({ objectID }) => {
    const pageLink = <Link className="default-object-data-page-link" to={`/objects/${objectID}`}>here</Link>;
    const objectPageLink = objectID > 0 && (
        <span> Click {pageLink} to view object page.</span>
    );

    return (
        <div className="default-object-data-container">
            <Header as="h3">Object preview unavailable.</Header>
            {objectPageLink}
        </div>
    );
};
