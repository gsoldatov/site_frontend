import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../display-controls/display-control-checkbox";
import { DisplayControlDropdown } from "../display-controls/display-control-dropdown";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";
import { enumShowDescriptionComposite } from "../../../store/state-templates/composite-subobjects";


/**
 * Component for switching `show_description` setting of an object.
 */
 export const ShowDescriptionSwitch = ({ objectID }) => {
    const dispatch = useDispatch();
    const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).show_description);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ show_description: !showDescription }, objectID)), [objectID, showDescription]);

    return (
        <DisplayControlCheckbox checked={showDescription} onClick={onClick} label="Show Description" />
    );
};


const showDescriptionDropdownOptions = Object.values(enumShowDescriptionComposite).map((t, k) => ({ key: k, text: t.name, value: t.value }));

/**
 * Component for switching `show_description_composite` setting of a composite object's subobject.
 */
export const SubobjectShowDescriptionSwitch = ({ objectID, subobjectID }) => {
    const dispatch = useDispatch();

    // Current value
    const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.subobjects[subobjectID].show_description_composite);

    // On change callback
    const onChange = useMemo(() => 
        (e, data) => dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobject", subobjectID, show_description_composite: data.value }}, objectID))
    , [objectID, subobjectID]);

    return (
        <DisplayControlDropdown options={showDescriptionDropdownOptions} value={showDescription} 
            onChange={onChange} label="Show Description in Parent Object" />
    );
};


// /**      TODO delete after testing new version
//  * Component for switching `show_description` setting of an object.
//  */
// export const ShowDescriptionSwitch = ({ objectID }) => {
//     const dispatch = useDispatch();
//     const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).show_description);
//     const onClick = useMemo(() => () => dispatch(setEditedObject({ show_description: !showDescription }, objectID)), [objectID, showDescription]);

//     return (
//         <div className="display-control-container">
//             <Checkbox className="display-control-checkbox-container" checked={showDescription} onClick={onClick} label="Show Description" />
//         </div>
//     );
// };


// const showDescriptionDropdownOptions = Object.values(enumShowDescriptionComposite).map((t, k) => ({ key: k, text: t.name, value: t.value }));

// /**
//  * Component for switching `show_description_composite` setting of a composite object's subobject.
//  */
// export const SubobjectShowDescriptionSwitch = ({ objectID, subobjectID }) => {
//     const dispatch = useDispatch();

//     // Current value
//     const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.subobjects[subobjectID].show_description_composite);

//     // On change callback
//     const onChange = useMemo(() => 
//         (e, data) => dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobject", subobjectID, show_description_composite: data.value }}, objectID))
//     , [objectID, subobjectID]);

//     const labelText = "Show Description in Parent Object";

//     return (
//         <div className="display-control-container">
//             <div className="display-control-dropdown-container">
//                 <div className="display-control-label" title={labelText}>
//                     {labelText}
//                 </div>
//                 <Dropdown className="display-control-dropdown"
//                     selection
//                     value={showDescription}
//                     options={showDescriptionDropdownOptions}
//                     onChange={onChange}
//                 />
//             </div>
//         </div>
//     );
// };
