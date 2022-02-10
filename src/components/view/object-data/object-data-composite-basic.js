import React from "react";
import { useSelector } from "react-redux";

import { getSingleColumnSubobjectDisplayOrder } from "../../../store/state-util/composite";
import { ObjectsViewCard } from "../objects-view-card";


/**
 * Basic signle-column representation of a composite object's object data display component on the /objects/view/:id page.
 */
export const ObjectDataCompositeBasic = ({ objectID }) => {
    // Sort subobjects by column -> row asc
    const subobjectIDOrder = useSelector(state => getSingleColumnSubobjectDisplayOrder(state.composite[objectID]));

    const subobjectCards = subobjectIDOrder.map((subobjectID, key) => <ObjectsViewCard key={key} objectID={objectID} subobjectID={subobjectID} isSubobject />);

    return (
        <div className="objects-view-data composite-basic">
            {subobjectCards}
        </div>
    );
};
