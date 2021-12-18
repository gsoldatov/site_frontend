import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";

import { Link } from "react-router-dom";
import { Header } from "semantic-ui-react";

import { ObjectPreviewTagList } from "./object-preview-tags";


/**
 * Object preivew displayed in the objects feed.
 */
export const ObjectPreview = ({ objectID }) => {
    const timestampValue = useSelector(state => {
        const object = state.objects[objectID];
        if(!object) return null;
        return moment(object.feed_timestamp || object.modified_at).format("lll");
    });
    
    const objectName = useSelector(state => (state.objects[objectID] || {}).object_name);
    let objectDescription = useSelector(state => (state.objects[objectID] || {}).object_description);
    if (objectDescription === "") objectDescription = "<No description available>";
    
    // Exit if object is not found (after logout case)
    if (!objectName) return null;

    const timestamp = <div className="object-preview-timestamp">{timestampValue}</div>;

    const header = (
        <Header as="h2" className="object-preview-header">
            <Link to={`/objects/view/${objectID}`}>
                {objectName}
            </Link>
        </Header>
    );

    const description = (
        <div className="object-preview-description">{objectDescription}</div>
    );

    return (
        <div className="object-preview-container">
            {timestamp}
            {header}
            {description}
            <ObjectPreviewTagList objectID={objectID} />
        </div>
    );
};
