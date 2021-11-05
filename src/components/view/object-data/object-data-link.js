import React from "react";
import { useSelector } from "react-redux";


/**
 * Link object data display component on the /objects/view/:id page.
 */
export const ObjectDataLink = ({ objectID }) => {
    const linkValue = useSelector(state => state.links[objectID].link);

    const text = linkValue; // TODO merge with description if set to

    return <div className="objects-view-data link">
        <a href={linkValue}>
            {text}
        </a>
    </div>;
};
