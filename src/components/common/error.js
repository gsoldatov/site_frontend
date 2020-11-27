import React from "react";
import { Container, Message } from "semantic-ui-react";

import StyleError from "../../styles/error.css";


/* Error message component */
export default ({ header, text }) => {
    const _header = header === undefined ? "Error" : header;
    return (
        <Container className="error-container">
            <Message negative>
                <Message.Header>{_header}</Message.Header>
                {text}
            </Message>
        </Container>
    )
}