import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "semantic-ui-react";

import { setEditedObject } from "../../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../../store/state-util/ui-objects-edit";

/**
 * Link input form.
 */
export const LinkInput = ({ objectID }) => {
    const dispatch = useDispatch();
    
    const link = useSelector(getEditedOrDefaultObjectSelector(objectID)).link.link;

    const handleLinkChange = useRef(e => dispatch(setEditedObject({ link: { link: e.target.value }}, objectID))).current;

    return (
        <Form>
            <Form.Input label="Link" placeholder="Link" value={link} onChange={handleLinkChange} />
        </Form>
    );
};
