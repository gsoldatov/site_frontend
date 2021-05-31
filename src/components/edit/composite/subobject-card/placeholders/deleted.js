import React from "react";
import { Container, Message } from "semantic-ui-react";


export const DeletedPlaceholder = () => {
    return (
        <div className="composite-subobject-placeholder-container deleted-subobject">
            <Container className="subobject-error-container">
                <Message warning className="subobject-error-message">
                    <Message.Header>Subobject is marked for deletion.</Message.Header>
                    Click on "Restore deleted subobject" button to restore it.
                </Message>
            </Container>
        </div>
    );
}