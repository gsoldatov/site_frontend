import React, { useMemo } from "react";
import { Button, Message } from "semantic-ui-react";

import { SubobjectDeleteMode } from "../../../../../../../store/types/data/composite";


/**
 * Card placeholder displayed when subobject could not be added to state.editedObjects.
 * 
 * Provides delete/restore buttons and displays different styles based on whether subobject is set for deletion.
 */
 export const CardPlaceholder = ({ fetchError, isSubobjectDeleted, subobjectID, updateCallback }) => {
    const onClick = useMemo(() => () => updateCallback({ 
        compositeUpdate: { 
            command: "updateSubobject", 
            subobjectID, 
            deleteMode: isSubobjectDeleted ? SubobjectDeleteMode.none : SubobjectDeleteMode.subobjectOnly 
    }}), [isSubobjectDeleted]);

    const headerText = isSubobjectDeleted ? "Object is unavailable and is set for deletion." : "Object is unavailable.";
    const buttonText = isSubobjectDeleted ? "Restore" : "Delete";
    
    return (    // outer <div> is added in <SubobjectCard> component to avoid error caused by passing a component to React DND connector.
        // <div className="composite-subobject-card no-padding">
            <Message className="subobject-error-message" error={!isSubobjectDeleted} warning={isSubobjectDeleted}>
                <Message.Header>{headerText}</Message.Header>
                <div className="subobject-error-message-text">{fetchError}</div>
                <div className="subobject-error-button-container">
                    <Button className="subobject-error-button" size="small" onClick={onClick}>{buttonText}</Button>
                </div>
            </Message>
        // </div>
    );
};
