import React from "react";
import { Message, MessageHeader } from "semantic-ui-react";

import { useURLParamIDs } from "../../../util/hooks/use-url-param-ids";


/**
 * /tags/view prompt text, which is displayed if no valid tag IDs are selected
 */
export const SelectPrompt = () => {
    const tagIDs = useURLParamIDs("tagIDs");

    if (tagIDs.length > 0) return null;

    return (
        <Message>
            <MessageHeader>Select a tag</MessageHeader>
        </Message>
    );
};
