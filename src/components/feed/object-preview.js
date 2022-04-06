import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";

import { Link } from "react-router-dom";
import { Header } from "semantic-ui-react";

import { ObjectPreviewTagList } from "./object-preview-tags";
import { useParsedMarkdownState } from "../../util/use-parsed-markdown-state";


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
    let parsedDescription = useParsedMarkdownState(objectDescription);
    if (parsedDescription === "") parsedDescription = "&ltNo description available&gt";
    
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

    const description = parsedDescription && (
        <div className="object-preview-description">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsedDescription }} />
        </div>
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
