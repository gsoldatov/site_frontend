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
export const ObjectsViewCard = ({ objectID, isSubobject = false }) => {
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

    // Object card
    const containerClassName = "objects-view-card-container"
        .concat(isSubobject ? " subobject" : "");
    const tagList = !isSubobject && <ObjectTagList objectID={objectID} />;

    return (
        <div className = {containerClassName}>
            <ObjectAttributes objectID={objectID} isSubobject={isSubobject} />
            <ObjectDataSwitch objectID={objectID} isSubobject={isSubobject} />
            {tagList}
        </div>
    );
};
