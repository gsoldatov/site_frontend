import React from "react";
import { useSelector } from "react-redux";
import { enumShowDescriptionComposite } from "../../../store/state-templates/composite-subobjects";


/**
 * Link object data display component on the /objects/view/:id page.
 */
export const ObjectDataLink = ({ objectID, subobjectID, isSubobject = false }) => {
    const _id = isSubobject ? subobjectID : objectID;
    const mergeLinkWithDescription = useSelector(state => {
        if (!isSubobject) {
            // NOT a subobject AND show_description_as_link = true
            return state.links[objectID].show_description_as_link;
        } else {
            const _showDescriptionAsLink = state.links[subobjectID].show_description_as_link;
            const _showDescriptionAsLinkComposite = state.composite[objectID].subobjects[subobjectID].show_description_as_link_composite;
            // is a subobject AND (
            return (
                // show_description_as_link_composite = yes
                _showDescriptionAsLinkComposite === enumShowDescriptionComposite.yes.value
                // OR (show_description_as_link_composite = inherit AND show_description_as_link = true)
                || (_showDescriptionAsLinkComposite === enumShowDescriptionComposite.inherit.value && _showDescriptionAsLink)
            // )
            );
        }
    });

    const linkData = useSelector(state => state.links[_id]);
    const _objectDescription = useSelector(state => state.objects[_id].object_description);
    const text = mergeLinkWithDescription ? _objectDescription : linkData.link;

    return <div className="objects-view-data link">
        <a href={linkData.link}>
            {text}
        </a>
    </div>;
};
