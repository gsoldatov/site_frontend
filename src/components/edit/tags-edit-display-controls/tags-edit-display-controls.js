import React from "react";

import { TagIsPublishedSwitch } from "./is-published-switch";


/**
 * Container component for all display options of the currently edited tag
 */
export const TagsEditDisplayControls = () => {
    return (
        <div className="tags-edit-display-container">
            <TagIsPublishedSwitch />
        </div>
    );
};
