import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { RenderedMarkdown } from "../../modules/markdown/rendered-markdown";

import { getDefaultShowDescriptionAsLinkSelector } from "../../../store/state-util/ui-objects-view";
import { useParsedMarkdownState } from "../../../util/use-parsed-markdown-state";

import StyleObjectsViewLink from "../../../styles/pages/objects-view/link.css";


/**
 * Displays link object data in a <ObjectsViewCard> for the provided `objectID`.
 * 
 * If `dataProps.showDescriptionAsLinkSelector` is provided, uses it to check if object description should be used as link description.
 */
 export const Link_ = ({ objectID, dataProps = {} }) => {
    //  What text (link or description) should be rendered
    const defaultShowDescriptionAsLinkSelector = useMemo(() => getDefaultShowDescriptionAsLinkSelector(objectID), [objectID]);
    const showDescriptionAsLinkSelector = dataProps.showDescriptionAsLinkSelector || defaultShowDescriptionAsLinkSelector;
    const showDescriptionAsLink = useSelector(showDescriptionAsLinkSelector);

    const linkData = useSelector(state => state.links[objectID]);
    const objectDescription = useSelector(state => (state.objects[objectID] || {}).object_description);

    // Parsed Markdown (parse empty text if description is not merged with link)
    const parsedObjectDecsription = useParsedMarkdownState(showDescriptionAsLink ? objectDescription : "");
    const parsedMarkdown = showDescriptionAsLink ? parsedObjectDecsription : linkData.link;

    // CSS classnames
    const className = "objects-view-data link" + (objectDescription.length === 0 || showDescriptionAsLink ? " no-description" : "");

    // Result
    return parsedMarkdown.length > 0 && (
        <div className={className}>
            <a href={linkData.link}>
                <RenderedMarkdown parsedMarkdown={parsedMarkdown} />
            </a>
        </div>
    );
};
