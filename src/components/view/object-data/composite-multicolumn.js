import React from "react";
import { useSelector } from "react-redux";

import { getSubobjectDisplayOrder } from "../../../store/state-util/composite";
import { SubobjectObjectsViewCard } from "../objects-view-card";

import StyleCompositeMulticolumn from "../../../styles/objects-view/composite-multicolumn.css";


/**
 * Multicolumn composite object's object data display component in <ObjectsViewCard>.
 */
export const CompositeMulticolumn = ({ objectID }) => {
    const composite = useSelector(state => state.composite[objectID]);
    const subobjectOrder = getSubobjectDisplayOrder(composite);
    
    const columns = subobjectOrder.map((columnSubobjectIDs, k) => <Column key={k} objectID={objectID} subobjectIDs={columnSubobjectIDs} />);

    return (
        <div className="objects-view-data composite-multicolumn">
            {columns}
        </div>
    );
};


/**
 * A single column in multicolumn object.
 */
const Column = ({ objectID, subobjectIDs }) => {
    const subobjectCards = subobjectIDs.map((subobjectID, key) => <SubobjectObjectsViewCard key={key} objectID={objectID} subobjectID={subobjectID} classNames={["multicolumn-subobject"]} />);

    return (
        <div className="objects-view-data-composite-multicolumn-column">
            {subobjectCards}
        </div>
    );
};
