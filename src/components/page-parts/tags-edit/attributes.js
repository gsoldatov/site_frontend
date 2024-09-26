import React, { useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { TimeStamps, NameInput, DescriptionEditor } from "../../edit/common/edit-page";

import { setCurrentTag } from "../../../actions/tags-edit";


/**
 * Created at & modified at timestamps
 */
export const TagTimestamps = () => {
    const createdAtSelector = useMemo(() => state => state.tagUI.currentTag.created_at, []);
    const modifiedAtSelector = useMemo(() => state => state.tagUI.currentTag.modified_at, []);
    const isDisplayedSelector = useMemo(() => state => state.tagUI.currentTag.tag_id, []);

    return (
        <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} 
            isDisplayedSelector={isDisplayedSelector} />
    );
};


/**
 * Tag name & description
 */
export const TagNameDescription = () => {
    const dispatch = useDispatch();
    const name = useSelector(state => state.tagUI.currentTag.tag_name);
    const description = useSelector(state => state.tagUI.currentTag.tag_description);

    const nameOnChange = useRef(tag_name => {
        dispatch(setCurrentTag({ tag_name }));
    }).current;

    const descriptionOnChange = useRef(tag_description => {
        dispatch(setCurrentTag({ tag_description }));
    }).current;

    return (
        <>
            <NameInput label="Tag Name" placeholder="Tag name" value={name} onChange={nameOnChange} />
            <DescriptionEditor label="Tag Description" placeholder="Tag description" value={description} onChange={descriptionOnChange} />
        </>
    );
};
