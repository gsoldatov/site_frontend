import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { getDefaultShowDescriptionSelector } from "../../../store/state-util/ui-objects-view";
import { useParsedMarkdownState } from "../../../util/use-parsed-markdown-state";


/**
 * Object description, displayed inside an <ObjectsViewCard>.
 */
 export const Description = ({ objectID, descriptionProps = {} }) => {
    // Raw markdown
    const objectDecsription = useSelector(state => (state.objects[objectID] || {}).object_description);

    // Check if description should be rendered
    const defaultShowDescriptionSelector = useMemo(() => getDefaultShowDescriptionSelector(objectID), [objectID]);
    const showDescriptionSelector = descriptionProps.showDescriptionSelector || defaultShowDescriptionSelector;
    const showDescription = useSelector(showDescriptionSelector);

    // Render empty string to avoid calling worker, if description should not be rendered
    const parsedDescription = useParsedMarkdownState(showDescription ? objectDecsription : "");

    // Result
    return parsedDescription && (
        <div className="objects-view-description">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsedDescription }} />
        </div>
    );
};
