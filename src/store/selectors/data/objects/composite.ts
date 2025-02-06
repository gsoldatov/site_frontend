import type { Composite, CompositeSubobjects } from "../../../../types/store/data/composite";


/** Composite object's data state selectors. */
export class CompositeSelectors {
    /**
     * Returns a list of subobject IDs sorted by their column and rows in the ascending order.
     */
    static getSingleColumnSubobjectDisplayOrder (composite: Composite) {
        return Object.keys(composite.subobjects).map(k => parseInt(k)).sort((a, b) => {
            const { subobjects } = composite;
            if (subobjects[a].column < subobjects[b].column) return -1;
            if (subobjects[a].column === subobjects[b].column && subobjects[a].row < subobjects[b].row) return -1;
            return 1;
        });
    }

    /**
     * Returns the ordered by column/row subobject positions of `composite` object. Result is a list with each item being a list for a specific column.
     * If `collapseEmptyRows` is set to true, removes empty rows inside each column.
     */
    static getSubobjectDisplayOrder(composite: CompositeSubobjects, collapseEmptyRows: boolean = false) {
        let displayOrder: number[][] = [[]];    // always return at least one empty column

        for (let strSubobjectID of Object.keys(composite.subobjects)) {
            const subobjectID = parseInt(strSubobjectID);
            const { row, column } = composite.subobjects[subobjectID];

            // Insert empty lists for new column and all not-yet added columns to the left of it
            for (let i = displayOrder.length; i <= column; i++)
                displayOrder.push([]);
            
            // Insert subobject
            displayOrder[column][row] = subobjectID;
        }

        // Collapse empty rows inside each column
        if (collapseEmptyRows) {
            for (let i = 0; i < displayOrder.length; i++)
                displayOrder[i] = displayOrder[i].filter(subobjectID => subobjectID !== undefined)
        }

        return displayOrder;
    };
}
