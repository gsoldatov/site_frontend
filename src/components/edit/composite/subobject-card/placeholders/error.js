import React, { useMemo } from "react";
import { Button, Container, Message } from "semantic-ui-react";

import { enumDeleteModes } from "../../../../../store/state-templates/composite-subobjects";


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
            deleteMode: isSubobjectDeleted ? enumDeleteModes.none : enumDeleteModes.subobjectOnly 
    }}), [isSubobjectDeleted]);

    const headerText = isSubobjectDeleted ? "Object is unavailable and is set for deletion." : "Object is unavailable.";
    const buttonText = isSubobjectDeleted ? "Restore" : "Delete";
    
    return (
        <div className="composite-subobject-card no-padding">
            <Message className="subobject-error-message" error={!isSubobjectDeleted} warning={isSubobjectDeleted}>
                <Message.Header>{headerText}</Message.Header>
                <div className="subobject-error-message-text">{fetchError}</div>
                <div className="subobject-error-button-container">
                    <Button className="subobject-error-button" size="small" onClick={onClick}>{buttonText}</Button>
                </div>
            </Message>
        </div>
    );
};
