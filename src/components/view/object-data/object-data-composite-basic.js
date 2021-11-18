import React from "react";
import { useSelector } from "react-redux";
import { ObjectsViewCard } from "../objects-view-card";


/**
 * Basic signle-column representation of a composite object's object data display component on the /objects/view/:id page.
 */
export const ObjectDataCompositeBasic = ({ objectID }) => {
    const subobjects = useSelector(state => state.composite[objectID].subobjects);

    // Sort subobjects by column -> row asc
    const subobjectIDOrder = Object.keys(subobjects).sort((a, b) => {
        if (subobjects[a].column < subobjects[b].column) return -1;
        if (subobjects[a].column === subobjects[b].column && subobjects[a].row < subobjects[b].row) return -1;
        return 1;
    });

    const subobjectCards = subobjectIDOrder.map((subobjectID, key) => <ObjectsViewCard key={key} objectID={objectID} subobjectID={subobjectID} isSubobject />);

    return (
        <div className="objects-view-data composite-basic">
            {subobjectCards}
        </div>
    );
};
