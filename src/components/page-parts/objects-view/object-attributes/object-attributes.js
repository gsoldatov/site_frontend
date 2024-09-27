import React from "react";
import { useSelector } from "react-redux";

import { Timestamp } from "./timestamp";
import { Header_ } from "./header";
import { ObjectIsEdited } from "./object-is-edited-warning";
import { Description } from "./description";


/**
 * Container for object/subobject attributes.
 */
export const ObjectAttributes = ({ objectID, attributeProps = {} }) => {
    // Check if attributes should be rendered
    const displayAttributes = attributeProps.displayAttributes !== undefined ? attributeProps.displayAttributes : true;
    const isRendered = useSelector(state => displayAttributes && state.objects[objectID] !== undefined);

    const { timestampProps, headerProps, descriptionProps } = attributeProps;

    return isRendered && (
        <div className="objects-view-attributes">
            <Timestamp objectID={objectID} timestampProps={timestampProps} />
            <Header_ objectID={objectID} headerProps={headerProps} />
            <ObjectIsEdited objectID={objectID} />
            <Description objectID={objectID} descriptionProps={descriptionProps} />
        </div>
    );
};
