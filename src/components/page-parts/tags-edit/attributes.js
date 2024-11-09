import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Timestamps, NameInput, DescriptionEditor } from "../../modules/edit/attributes";

import { setCurrentTag } from "../../../reducers/ui/tags-edit";


/**
 * Created at & modified at timestamps
 */
export const TagTimestamps = () => {
    const createdAt = useSelector(state => state.tagsEditUI.currentTag.created_at);
    const modifiedAt = useSelector(state => state.tagsEditUI.currentTag.modified_at);
    const isDisplayed = useSelector(state => state.tagsEditUI.currentTag.tag_id > 0);

    if (!isDisplayed) return null;

    return <Timestamps createdAt={createdAt} modifiedAt={modifiedAt} />;
};


/**
 * Tag name & description
 */
export const TagNameDescription = () => {
    const dispatch = useDispatch();
    const name = useSelector(state => state.tagsEditUI.currentTag.tag_name);
    const description = useSelector(state => state.tagsEditUI.currentTag.tag_description);

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
