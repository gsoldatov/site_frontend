import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../display-controls/display-control-checkbox";
import { DisplayControlDropdown } from "../display-controls/display-control-dropdown";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";
import { enumShowDescriptionComposite } from "../../../store/state-templates/composite-subobjects";


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


// /** TODO delete after testing new version
//  * Component for switching `show_description_as_link` setting of a link object.
//  */
// export const ShowDescriptionAsLinkSwitch = ({ objectID }) => {
//     const dispatch = useDispatch();

//     const isLink = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).object_type === "link");
//     const showDescriptionAsLink = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).link.show_description_as_link);

//     const onClick = useMemo(() => () => dispatch(setEditedObject({ link: { show_description_as_link: !showDescriptionAsLink }}, objectID)), [objectID, showDescriptionAsLink]);

//     return isLink && (
//         <div className="display-control-container">
//             <Checkbox className="display-control-checkbox-container" checked={showDescriptionAsLink} onClick={onClick} label="Show Description as Link" />
//         </div>
//     );
// };


// const showDescriptionDropdownOptions = Object.values(enumShowDescriptionComposite).map((t, k) => ({ key: k, text: t.name, value: t.value }));

// /**
//  * Component for switching `show_description_as_link_composite` setting of a composite object's subobject.
//  */
// export const SubobjectShowDescriptionAsLinkSwitch = ({ objectID, subobjectID }) => {
//     const dispatch = useDispatch();

//     const isLink = useSelector(state => getEditedOrDefaultObjectSelector(subobjectID)(state).object_type === "link");
//     const showDescriptionAsLink = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.subobjects[subobjectID].show_description_as_link_composite);

//     const onChange = useMemo(() => 
//         (e, data) => dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobject", subobjectID, show_description_as_link_composite: data.value }}, objectID))
//     , [objectID, subobjectID]);

//     const labelText = "Show Description as Link in Parent Object";

//     return isLink && (
//         <div className="display-control-container">
//             <div className="display-control-dropdown-container">
//                 <div className="display-control-label" title={labelText}>
//                     {labelText}
//                 </div>
//                 <Dropdown className="display-control-dropdown"
//                     selection
//                     value={showDescriptionAsLink}
//                     options={showDescriptionDropdownOptions}
//                     onChange={onChange}
//                 />
//             </div>
//         </div>
//     );
// };
