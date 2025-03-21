import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../../../modules/edit/display/display-control-checkbox";
import { DisplayControlDropdown } from "../../../modules/edit/display/display-control-dropdown";

import { updateEditedComposite, updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";
import { showDescriptionCompositeOptions } from "../../../../types/store/ui/general/show-description-composite";


/**
 * Component for switching `show_description_as_link` setting of a link object.
 */
 export const ShowDescriptionAsLinkSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    const isLink = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).object_type === "link");
    const showDescriptionAsLink = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).link.show_description_as_link);

    const onClick = useMemo(() => () => {
        dispatch(updateEditedObject(objectID, { link: { show_description_as_link: !showDescriptionAsLink }}))
    }, [objectID, showDescriptionAsLink]);

    return isLink && (
        <DisplayControlCheckbox checked={showDescriptionAsLink} onClick={onClick} label="Show Description as Link" />
    );
};


const showDescriptionDropdownOptions = Object.values(showDescriptionCompositeOptions).map((t, k) => ({ key: k, text: t.name, value: t.value }));

/**
 * Component for switching `show_description_as_link_composite` setting of a composite object's subobject.
 */
export const SubobjectShowDescriptionAsLinkSwitch = ({ objectID, subobjectID }) => {
    const dispatch = useDispatch();

    const isLink = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(subobjectID)(state).object_type === "link");
    const showDescriptionAsLink = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).composite.subobjects[subobjectID].show_description_as_link_composite);

    const onChange = useMemo(() => 
        (e, data) => dispatch(updateEditedComposite(objectID, { command: "updateSubobject", subobjectID, show_description_as_link_composite: data.value }))
    , [objectID, subobjectID]);

    return isLink && (
        <DisplayControlDropdown options={showDescriptionDropdownOptions} value={showDescriptionAsLink} 
            onChange={onChange} label="Show Description as Link in Parent Object" />
    );
};
