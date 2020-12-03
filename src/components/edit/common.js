import React, { useRef } from "react";
import { Form, Loader, Grid } from "semantic-ui-react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import Error from "../common/error";

import StyleEditInputs from "../../styles/edit-inputs.css";

/*
    Reusable components for tag/object edit pages.
*/
// On load fetch indication & error
export const LoadIndicatorAndError = ({ fetchSelector, loadingMessage = "Loading..." }) => {
    const fetch = useSelector(fetchSelector);
    if (fetch.isFetching) return <Loader active inline="centered">{loadingMessage}</Loader>;
    if (fetch.fetchError) return <Error text={fetch.fetchError}/>;
    return null;
}


// Save fetch error message
export const SaveError = ({ fetchSelector }) => {
    const fetch = useSelector(fetchSelector);
    if (fetch.isFetching || !fetch.fetchError) return null;
    return <Error header="" text={fetch.fetchError}/>;
};


// Created at & modified at timestamps
export const TimeStamps = ({ createdAtSelector, modifiedAtSelector }) => {
    const { id } = useParams();
    if (id === "add") {
        return null;
    }
    const createdAt = useSelector(createdAtSelector);
    const modifiedAt = useSelector(modifiedAtSelector);
    return (
        <Grid padded columns={2}>
            <Grid.Column>
                <p><b>Created at: </b> {createdAt}</p>
            </Grid.Column>
            <Grid.Column>
                <p><b>Modified at: </b> {modifiedAt}</p>
            </Grid.Column>
        </Grid>
    );
}


// Name and description input form
export const NameDescriptionInput = ({ nameLabel, nameSelector, nameOnChange, getNameOnChangeParams,
                    descriptionLabel, descriptionSelector, descriptionOnChange, getDescriptionOnChangeParams }) => {
    const dispatch = useDispatch();    

    // App state tag name and description
    const name = useSelector(nameSelector);
    const description = useSelector(descriptionSelector);


    const handleNameChange = e => {
        dispatch(nameOnChange(getNameOnChangeParams(e.target.value)));
    };

    const handleDescriptionChange = e => {
        dispatch(descriptionOnChange(getDescriptionOnChangeParams(e.target.value)));

        if (descriptionRef.current) {
            descriptionRef.current.style.height = "inherit";  // reset
            descriptionRef.current.style.height = descriptionRef.current.scrollHeight + "px";   // set to text height
        }
    };

    const descriptionRef = useRef(null);

    return (
        <Form>
            <Form.Input label={nameLabel} placeholder={nameLabel} value={name} onChange={handleNameChange} />
            <Form.Field>
                <label>{descriptionLabel}</label>
                <textarea className="edit-page-textarea" placeholder={descriptionLabel} ref={descriptionRef} value={description} onChange={handleDescriptionChange} />
            </Form.Field>
        </Form>
    );
};
