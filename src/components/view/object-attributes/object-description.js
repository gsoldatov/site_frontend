import React from "react";
import { useSelector } from "react-redux";
import { enumShowDescriptionComposite } from "../../../store/state-templates/composite-subobjects";


/**
 * Object view description.
 */
export const ObjectDescription = ({ objectID, subobjectID, isSubobject = false }) => {
    const _id = isSubobject ? subobjectID : objectID;
    
    const text = useSelector(state => state.objects[_id].object_description);
    const hideDescription = useSelector(state => {
        if (text.length === 0) return true;

        if (!isSubobject) {
            // Description of the main object on the page
            const objectType = state.objects[objectID].object_type;
            const showDescription = state.objects[objectID].show_description;
            const showDescriptionAsLink = (state.links[objectID] || {}).show_description_as_link;
            return (
                // show_description = false
                !showDescription
                // OR (object type = link AND show_description_as_link = true)
                || (objectType === "link" && showDescriptionAsLink)
            );
        }
        else {
            const _objectType = state.objects[subobjectID].object_type;
            const _showDescription = state.objects[subobjectID].show_description;
            const _showDescriptionComposite = state.composite[objectID].subobjects[subobjectID].show_description_composite;
            const _showDescriptionAsLink = (state.links[subobjectID] || {}).show_description_as_link;
            const _showDescriptionAsLinkComposite = state.composite[objectID].subobjects[subobjectID].show_description_as_link_composite;
            
            return (
                // show_description_composite = no
                _showDescriptionComposite === enumShowDescriptionComposite.no.value
                // OR (show_description_composite = inherit AND show_description = false)
                || (_showDescriptionComposite === enumShowDescriptionComposite.inherit.value && !_showDescription)
                || (
                    // OR is a link AND (
                    _objectType === "link" && (
                        // show_description_as_link_composite = yes
                        _showDescriptionAsLinkComposite === enumShowDescriptionComposite.yes.value
                        // (show_description_as_link_composite = inherit AND show_description_as_link = true)
                        || (_showDescriptionAsLinkComposite === enumShowDescriptionComposite.inherit.value && _showDescriptionAsLink)
                    // )
                    )
                )
            );
        }

    });


    return !hideDescription && (
        <div className="objects-view-description">
            <pre>
                {text}
            </pre>
        </div>
    );
};
