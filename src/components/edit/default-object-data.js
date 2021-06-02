import React from "react";
import { Link } from "react-router-dom";
import { Header, Message } from "semantic-ui-react";


/*
    Default component, displayed when object data can't be displayed (no implementation or nested composite objects).
    If `subobjectCard` is true, applies separate styling to the component.
*/
export const DefaultObjectData = ({ objectID, subobjectCard }) => {
    // const messageContainerClassName = subobjectCard ? "composite-subobject-default-object-data-container": undefined;
    const messageContainerClassName = undefined;    // no styles are currently applied (Margin removal is not needed, because the component 
                                                    // is the first child of its parent and SUIR removes margin for it)
    const pageLink = <Link className="default-object-data-page-link" to={`/objects/${objectID}`}>here</Link>;
    
    const objectPageLink = objectID > 0 && subobjectCard
        ? <span> Click {pageLink} to view object page.</span>
        : null;

    return (
        <Message className={messageContainerClassName}>
            <Message.Header>Object preview unavailable.</Message.Header>
            {objectPageLink}
        </Message>
    );
};
