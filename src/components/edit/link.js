import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "semantic-ui-react";

import { setEditedObject } from "../../actions/object";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-object";

/*
    Link-specific edit & view components
*/
// Link input form
export const LinkInput = ({ objectID }) => {
    const dispatch = useDispatch();

    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;
    const link = useSelector(objectSelector).link;

    const handleLinkChange = useRef(e => dispatch(setEditedObject({ link: e.target.value }, objectID))).current;

    return (
        <Form>
            <Form.Input label="Link" placeholder="Link" value={link} onChange={handleLinkChange} />
        </Form>
    );
};
