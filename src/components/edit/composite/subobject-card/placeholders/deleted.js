import React from "react";
import { Message } from "semantic-ui-react";


/*
    Subobject tab placeholder displayed when subobject is deleted.
*/
export const DeletedPlaceholder = () => {
    return (
        <Message warning className="deleted-subobject-message">
            <Message.Header>Subobject is marked for deletion.</Message.Header>
            Click on "Restore deleted subobject" button to restore it.
        </Message>
    );
};
