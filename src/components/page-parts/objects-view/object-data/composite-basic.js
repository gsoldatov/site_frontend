import React from "react";
import { useSelector } from "react-redux";

import { CompositeSelectors } from "../../../../store/selectors/data/objects/composite";

import { SubobjectObjectsViewCard } from "../objects-view-card";

import StyleCompositeBasic from "../../../../styles/pages/objects-view/composite-basic.css";


/**
 * Basic signle-column representation of a composite object's object data display component on the /objects/view/:id page.
 */
export const CompositeBasic = ({ objectID }) => {
    // Sort subobjects by column -> row asc
    const subobjectIDOrder = useSelector(state => CompositeSelectors.getSingleColumnSubobjectDisplayOrder(state.composite[objectID]));

    const subobjectCards = subobjectIDOrder.map((subobjectID, key) => <SubobjectObjectsViewCard key={key} objectID={objectID} subobjectID={subobjectID} />);

    return (
        <div className="objects-view-data composite-basic">
            {subobjectCards}
        </div>
    );
};
