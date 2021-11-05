import React, { useState, useEffect } from "react";
import { Loader, Message } from "semantic-ui-react";
import { useDispatch } from "react-redux";

import { objectsViewOnLoadFetch } from "../../fetches/ui-objects-view";

import { ObjectAttributes } from "./object-attributes/object-attributes";
import { ObjectTagList } from "./object-tags";
import { ObjectDataSwitch } from "./object-data/object-data-switch";

import StyleObjectsViewCard from "../../styles/objects-view-card.css";


/**
 * Container for object/subobject attributes, tags and data.
 */
export const ObjectsViewCard = ({ objectID }) => {
    const dispatch = useDispatch();

    // User fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch missing object attributes and data
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(objectsViewOnLoadFetch(objectID));

            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(objectID) > 0) fetchData();
        else setError("User not found.");
    }, [objectID]);

    // Error message
    if (error.length > 0) return (
        <div className = "objects-view-card-container">
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching) return (
        <div className = "objects-view-card-container">
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    const test = (  // TODO delete
        <>
            {/* <Header as="h1">Header 1</Header>
            <div>Some text</div>
            <Header as="h2">Header 2</Header>
            <div>Some text</div>
            <Header as="h3">Header 3</Header>
            <div>Some text</div>
            <Header as="h4">Header 4</Header>
            <div>Some text</div>
            <Header as="h5">Header 5</Header>
            <div>Some text</div>
            <Header as="h6">Header 6</Header>
            <div>Some text</div> */}
        </>
    )

    return (
        <div className = "objects-view-card-container">
            <ObjectAttributes objectID={objectID} />
            <ObjectDataSwitch objectID={objectID} />
            <ObjectTagList objectID={objectID} />
            {test}
        </div>
    );

    /*
    TODO:
    + fetch object attributes, tags and data;
    + display loader and fetch error;
    - display object attributes;
    - display object data;
    - display object tags;
    + clear unused imports;
    */
};
