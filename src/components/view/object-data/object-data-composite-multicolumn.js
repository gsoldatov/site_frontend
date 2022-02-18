import React from "react";
import { useSelector } from "react-redux";

import { getSubobjectDisplayOrder } from "../../../store/state-util/composite";
import { ObjectsViewCard } from "../objects-view-card";


/**
 * Multicolumn composite object's object data display component on the /objects/view/:id page.
 */
export const ObjectDataCompositeMulticolumn = ({ objectID }) => {
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
    const subobjectCards = subobjectIDs.map((subobjectID, key) => <ObjectsViewCard key={key} objectID={objectID} subobjectID={subobjectID} isSubobject isMulticolumnComposite />);

    return (
        <div className="objects-view-data-composite-multicolumn-column">
            {subobjectCards}
        </div>
    );
};
