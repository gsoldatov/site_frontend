import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../display-controls/display-control-checkbox";

import { setCurrentTag } from "../../../actions/tags-edit";


/**
 * Component for switching `is_published` setting of the currently edited tag.
 */
 export const TagIsPublishedSwitch = () => {
    const dispatch = useDispatch();

    const isPublished = useSelector(state => state.tagUI.currentTag.is_published);
    const onClick = useMemo(() => () => dispatch(setCurrentTag({ is_published: !isPublished })), [isPublished]);

    return (
        <DisplayControlCheckbox checked={isPublished} onClick={onClick} label="Publish Tag" />
    );
};
