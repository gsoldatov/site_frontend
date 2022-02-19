import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { getDefaultShowDescriptionAsLinkSelector } from "../../../store/state-util/ui-objects-view";


/**
 * Displays link object data in a <ObjectsViewCard> for the provided `objectID`.
 * 
 * If `dataProps.showDescriptionAsLinkSelector` is provided, uses it to check if object description should be used as link description.
 */
export const Link_ = ({ objectID, dataProps = {} }) => {
    const defaultShowDescriptionAsLinkSelector = useMemo(() => getDefaultShowDescriptionAsLinkSelector(objectID), [objectID]);
    const showDescriptionAsLinkSelector = dataProps.showDescriptionAsLinkSelector || defaultShowDescriptionAsLinkSelector;
    const showDescriptionAsLink = useSelector(showDescriptionAsLinkSelector);

    const linkData = useSelector(state => state.links[objectID]);
    const objectDescription = useSelector(state => (state.objects[objectID] || {}).object_description);
    const text = showDescriptionAsLink ? objectDescription : linkData.link;

    return <div className="objects-view-data link">
        <a href={linkData.link}>
            {text}
        </a>
    </div>;
};
