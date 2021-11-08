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

    console.log("IN ObjectDataCompositeBasic RENDER, subobjectIDOrder =", subobjectIDOrder)

    const subobjectCards = subobjectIDOrder.map((subobjectID, key) => <ObjectsViewCard key={key} objectID={subobjectID} isSubobject />);

    return (
        <div className="objects-view-data composite-basic">
            {subobjectCards}
        </div>
    );



    //              - basic display mode:
    //                 - displays subobject cards:
    //                     - always in single column;
    //                     - ordered by column > row;
    //                 - cards:
    //                     - header;
    //                     - link to standalone view page;
    //                     - link to edit page;
    //                     - description;  // optionally (if displayed and not link with merged link and description (and description length > 0))
                        
    //                     - subobject data:
    //                         - link:
    //                             - modes:
    //                             - link URL;
    //                             - merged link and description;

    //                             - markdown:
    //                                 - rendered markdown;
                                
    //                             - to-do list:
    //                                 - display to-do list data;
    //                                 - disable editing for non-owning non-admins;
    //                                 - allow editing for admins and owners:
    //                                     - run debounced update fetch when to-do list data is updated;
                                
    //                             - composite:
    //                                 - link to standalone view page;
};
