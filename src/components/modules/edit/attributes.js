import React, { useMemo, useState, memo } from "react";
import { Form } from "semantic-ui-react";
import { useSelector } from "react-redux";
import moment from "moment";

import { MarkdownEditor } from "../../modules/markdown/markdown-editor";

import StyleEditAttributes from "../../../styles/modules/edit/attributes.css";


/**
 * Created at & modified at timestamps.
 */
export const Timestamps = ({ createdAtSelector, modifiedAtSelector, isDisplayedSelector }) => {
    const createdAt = moment(useSelector(createdAtSelector)).format("lll");
    const modifiedAt = moment(useSelector(modifiedAtSelector)).format("lll");
    const isDisplayed = useSelector(isDisplayedSelector);
    
    if (!isDisplayed) return null;

    return (
        <div className="created-modified-timestamps-container">
            <div className="created-modified-timestamps-item">
                    <div className="created-modified-item-header">Created at:</div>
                    <div className="created-modified-item-value timestamp-text">{createdAt}</div>
            </div>
            <div className="created-modified-timestamps-item">
                    <div className="created-modified-item-header">Modified at:</div>
                    <div className="created-modified-item-value timestamp-text">{modifiedAt}</div>
            </div>
        </div>
    );
};


/**
 * Name input control.
 */
export const NameInput = memo(({ label, placeholder, value, onChange }) => {
    const handleNameChange = useMemo(() => e => { onChange(e.target.value); }, []);

    return (
        <Form className="name-form">
            <Form.Input label={label} placeholder={placeholder} value={value} onChange={handleNameChange} />
        </Form>
    );
});


/**
 * Customized markdown editor component for editing & viewing tag/object description.
 */
export const DescriptionEditor = memo(({ label, placeholder, value, onChange }) => {
    const [parsedDescription, setParsedDescrtiption] = useState("");
    const onPostParse = useMemo(() => parsed => setParsedDescrtiption(parsed), []);

    return <MarkdownEditor header={label} editPlaceholder={placeholder} rawMarkdown={value} rawMarkdownOnChange={onChange}
        parsedMarkdown={parsedDescription} onPostParse={onPostParse} />;
});
