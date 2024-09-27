import React from "react";
import { Container, Message } from "semantic-ui-react";

import StyleError from "../../styles/modules/error.css";


/**
 * Error message component.
 */
export const ErrorMessage = ({ header, text, containerClassName, messageClassName }) => {
    const _header = header === undefined ? "Error" : header;
    const _containerClassName = containerClassName !== undefined ? containerClassName : "error-container";
    const _messageClassName = messageClassName !== undefined ? messageClassName : "error-message";
    return (
        <Container className={_containerClassName}>
            <Message negative className={_messageClassName}>
                <Message.Header>{_header}</Message.Header>
                {text}
            </Message>
        </Container>
    )
};
