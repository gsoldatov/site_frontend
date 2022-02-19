import React, { useState, useEffect } from "react";
import { Loader, Message } from "semantic-ui-react";
import { useDispatch } from "react-redux";

import { objectsViewCardOnLoadFetch } from "../../fetches/ui-objects-view";

import { ObjectAttributes } from "./object-attributes/object-attributes";
import { ObjectsViewTagList } from "./object-tags";
import { ObjectData, SubobjectDataSwitch } from "./object-data/object-data";

import { getSubobjectShowDescriptionAsLinkSelector, getSubobjectShowDescriptionSelector } from "../../store/state-util/ui-objects-view";

import StyleObjectsViewCard from "../../styles/objects-view-card.css";


/**
 * Container for object/subobject attributes, tags and data.
 */
export const ObjectsViewCard = ({ objectID, classNames, attributeProps, dataProps, tagProps }) => {
    const dispatch = useDispatch();

    // Fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch missing object attributes and data
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(objectsViewCardOnLoadFetch(objectID));

            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(objectID) > 0) fetchData();
        else setError("Object not found.");
    }, [objectID]);

    // Container classnames
    let containerClassNames = "objects-view-card-container";
    if (classNames instanceof Array && classNames.length > 0) containerClassNames += " " + classNames.join(" ");

    // Error message
    if (error.length > 0) return (
        <div className={containerClassNames}>
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching) return (
        <div className={containerClassNames}>
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    // Object card
    return (
        <div className = {containerClassNames}>
            <div className="objects-view-card-object-id">{objectID}</div>
            <ObjectAttributes objectID={objectID} attributeProps={attributeProps} />
            <ObjectData objectID={objectID} dataProps={dataProps} />
            <ObjectsViewTagList objectID={objectID} tagProps={tagProps} />
        </div>
    );
};


/**
 * Wrapper for <ObjectsViewCard> used to display subobject in inside a parent card (both for single & multicolumn display modes).
 */
 export const SubobjectObjectsViewCard = ({ objectID, subobjectID, classNames = [] }) => {
    const attributeProps = {
        // Timestamp is not displayed
        timestampProps: { displayTimestamp: false },
        // Smaller header
        headerProps: { headerTag: "h2" },
        // Custom selector for subobject description display condition
        descriptionProps: { showDescriptionSelector: getSubobjectShowDescriptionSelector(objectID, subobjectID) }
    };

    const dataProps = {
        // Composite subobject's data is not displayed
        DataSwitchComponent: SubobjectDataSwitch,

        // Custom selector for link data and description merge
        showDescriptionAsLinkSelector: getSubobjectShowDescriptionAsLinkSelector(objectID, subobjectID)
    };

    // Tags are not displayed
    const tagProps = { displayTags: false };

    return <ObjectsViewCard objectID={subobjectID} attributeProps={attributeProps} dataProps={dataProps} tagProps={tagProps} classNames={classNames} />;
};