import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { getDefaultShowDescriptionSelector } from "../../../store/state-util/ui-objects-view";


/**
 * Object description, displayed inside an <ObjectsViewCard>.
 */
export const Description = ({ objectID, descriptionProps = {} }) => {
    const text = useSelector(state => (state.objects[objectID] || {}).object_description);

    const defaultShowDescriptionSelector = useMemo(() => getDefaultShowDescriptionSelector(objectID), [objectID]);
    const showDescriptionSelector = descriptionProps.showDescriptionSelector || defaultShowDescriptionSelector;
    const renderDescription = useSelector(showDescriptionSelector) && text.length > 0;

    return renderDescription && (
        <div className="objects-view-description">
            {/* <pre>
                {text}
            </pre> */}
            {text}
        </div>
    );
};
