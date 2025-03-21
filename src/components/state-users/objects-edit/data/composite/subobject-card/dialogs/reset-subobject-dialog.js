import React from "react";
import { useSelector } from "react-redux";

import { SubobjectDialog } from "./subobject-dialog";


/**
 * Reset subobject dialog displayed in a subobject card.
 */
export const ResetSubobjectDialog = ({ objectID, subobjectID, updateCallback, setIsResetDialogDisplayed }) => {
    const { row, column } = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID]);

    const yesCallback = () => {
        setIsResetDialogDisplayed(false);
        if (subobjectID < 0)
            // Reset new subobject (add default state to state.editedObjects & reset composite subobject state, except for subobjectID, row & column)
            updateCallback({ compositeUpdate: { command: "addNewSubobject", subobjectID, row, column }});
        else
            // Reset edited subobject (reset state.editedObjects to the last saved state & reset composite subobject state, except for subobjectID, row & column)
            updateCallback({ compositeUpdate: { command: "addExistingSubobject", resetEditedObject: true, subobjectID, row, column }});
    };

    const noCallback = () => {
        setIsResetDialogDisplayed(false);
    };

    return (
        <SubobjectDialog header="Reset This Subobject?" yesCallback={yesCallback} noCallback={noCallback} />
    );
};
