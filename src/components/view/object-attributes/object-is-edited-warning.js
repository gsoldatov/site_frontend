import React from "react";
import { useSelector } from "react-redux";
import { Message } from "semantic-ui-react";


/**
 * "Object is edited" warning message.
 */
export const ObjectIsEdited = ({ objectID, subobjectID, isSubobject = false }) => {
    const _id = isSubobject ? subobjectID : objectID;
    const canRender = useSelector(state => _id in state.editedObjects);

    return canRender && (
        <Message className="objects-view-object-is-edited-container" warning>
            <Message.Header>Object is currently being edited</Message.Header>
            <Message.Content>Save the changes to see them on this page or reset the edited version to remove the message.</Message.Content>
        </Message>
    );
};
