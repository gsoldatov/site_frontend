import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../../../modules/edit/display/display-control-checkbox";
import { DisplayControlDropdown } from "../../../modules/edit/display/display-control-dropdown";

import { setEditedObject } from "../../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../../store/state-util/ui-objects-edit";
import { enumShowDescriptionComposite } from "../../../../store/state-templates/composite-subobjects";


/**
 * Component for switching `show_description_as_link` setting of a link object.
 */
 export const ShowDescriptionAsLinkSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    const isLink = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).object_type === "link");
    const showDescriptionAsLink = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).link.show_description_as_link);

    const onClick = useMemo(() => () => dispatch(setEditedObject({ link: { show_description_as_link: !showDescriptionAsLink }}, objectID)), [objectID, showDescriptionAsLink]);

    return isLink && (
        <DisplayControlCheckbox checked={showDescriptionAsLink} onClick={onClick} label="Show Description as Link" />
    );
};


const showDescriptionDropdownOptions = Object.values(enumShowDescriptionComposite).map((t, k) => ({ key: k, text: t.name, value: t.value }));

/**
 * Component for switching `show_description_as_link_composite` setting of a composite object's subobject.
 */
export const SubobjectShowDescriptionAsLinkSwitch = ({ objectID, subobjectID }) => {
    const dispatch = useDispatch();

    const isLink = useSelector(state => getEditedOrDefaultObjectSelector(subobjectID)(state).object_type === "link");
    const showDescriptionAsLink = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.subobjects[subobjectID].show_description_as_link_composite);

    const onChange = useMemo(() => 
        (e, data) => dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobject", subobjectID, show_description_as_link_composite: data.value }}, objectID))
    , [objectID, subobjectID]);

    return isLink && (
        <DisplayControlDropdown options={showDescriptionDropdownOptions} value={showDescriptionAsLink} 
            onChange={onChange} label="Show Description as Link in Parent Object" />
    );
};
