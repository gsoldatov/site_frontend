import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "semantic-ui-react";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";


/**
 * Link input form.
 */
export const LinkInput = ({ objectID }) => {
    const dispatch = useDispatch();
    
    const link = useSelector(ObjectsEditSelectors.editedOrDefaultSelector(objectID)).link.link;

    const handleLinkChange = useMemo(() => e => dispatch(updateEditedObject(objectID, { link: { link: e.target.value }})), [objectID]);

    return (
        <Form>
            <Form.Input label="Link" placeholder="Link" value={link} onChange={handleLinkChange} />
        </Form>
    );
};
