import React, { useMemo, useState, memo } from "react";
import { Form } from "semantic-ui-react";
import moment from "moment";

import { MarkdownEditor } from "../../modules/markdown/markdown-editor";

import StyleEditAttributes from "../../../styles/modules/edit/attributes.css";


/**
 * Created at & modified at timestamps.
 */
export const Timestamps = ({ createdAt, modifiedAt }) => {
    createdAt =  moment(createdAt).format("lll");
    modifiedAt =  moment(modifiedAt).format("lll");

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
        <Form>
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
