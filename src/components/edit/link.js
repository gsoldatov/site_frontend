import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "semantic-ui-react";

import { setCurrentObject } from "../../actions/object";

/*
    Link-specific edit & view components
*/
// Link input form
export const LinkInput = () => {
    const dispatch = useDispatch();
    const link = useSelector(state => state.objectUI.currentObject.link);
    const handleLinkChange = e => dispatch(setCurrentObject({ link: e.target.value }));

    return (
        <Form>
            <Form.Input label="Link" placeholder="Link" value={link} onChange={handleLinkChange} />
        </Form>
    );
};
