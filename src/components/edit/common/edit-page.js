import React, { useEffect, useRef } from "react";
import { Form, Loader } from "semantic-ui-react";
import { useSelector } from "react-redux";
import moment from "moment";

import Error from "../../common/error";

import StyleEditInputs from "../../../styles/edit-inputs.css";

/*
    Reusable components for tag/object edit pages.
*/

/**
 * On load fetch indication & error.
 */
export const LoadIndicatorAndError = ({ fetchSelector, loadingMessage = "Loading..." }) => {
    const fetch = useSelector(fetchSelector);
    if (fetch.isFetching) return <Loader active inline="centered">{loadingMessage}</Loader>;
    if (fetch.fetchError) return <Error text={fetch.fetchError}/>;
    return null;
}


/**
 * Save fetch error message.
 */
export const SaveError = ({ fetchSelector }) => {
    const fetch = useSelector(fetchSelector);
    if (fetch.isFetching || !fetch.fetchError) return null;
    return <Error header="" text={fetch.fetchError}/>;
};


/**
 * Created at & modified at timestamps.
 */
export const TimeStamps = ({ createdAtSelector, modifiedAtSelector, isDisplayedSelector }) => {
    const createdAt = moment(useSelector(createdAtSelector)).format("lll");
    const modifiedAt = moment(useSelector(modifiedAtSelector)).format("lll");
    const isDisplayed = useSelector(isDisplayedSelector);
    
    if (!isDisplayed) return null;

    return (
        <div className="created-modified-timestamps-container">
            <div className="created-modified-timestamps-item">
                <p>
                    <b>Created at:</b>
                    <span className="created-modified-timestamps-value">{createdAt}</span>
                </p>
            </div>
            <div className="created-modified-timestamps-item">
                <p>
                    <b>Modified at:</b>
                    <span className="created-modified-timestamps-value">{modifiedAt}</span>
                </p>
            </div>
        </div>
    );
}


/**
 * Name and description input form.
 */
export const NameDescriptionInput = ({ nameLabel, namePlaceholder, name, nameOnChange,
    descriptionLabel, descriptionPlaceholder, description, descriptionOnChange }) => {
    
    const descriptionRef = useRef(null);
    const resizeDescriptionInput = useRef(() => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = "inherit";  // reset
            descriptionRef.current.style.height = descriptionRef.current.scrollHeight + "px";   // set to text height
        }
    }).current;

    const handleNameChange = useRef(e => {
        nameOnChange(e.target.value);
    }).current;

    const handleDescriptionChange = useRef(e => {
        descriptionOnChange(e.target.value);
        resizeDescriptionInput();
    }).current;

    // Resize description input on start
    useEffect(() => {
        resizeDescriptionInput();
    }, []);

    return (
        <Form className="name-description-form">
            <Form.Input label={nameLabel} placeholder={namePlaceholder} value={name} onChange={handleNameChange} />
            <Form.Field>
                <label>{descriptionLabel}</label>
                <textarea className="edit-page-textarea" placeholder={descriptionPlaceholder} ref={descriptionRef} value={description} onChange={handleDescriptionChange} />
            </Form.Field>
        </Form>
    );
};
