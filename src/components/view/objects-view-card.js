import React, { useState, useEffect } from "react";
import { Loader, Message } from "semantic-ui-react";
import { useDispatch } from "react-redux";

import { objectsViewCardOnLoadFetch } from "../../fetches/ui-objects-view";

import { ObjectAttributes } from "./object-attributes/object-attributes";
import { ObjectsViewTagList } from "./object-tags";
import { ObjectDataSwitch } from "./object-data/object-data-switch";

import StyleObjectsViewCard from "../../styles/objects-view-card.css";


/**
 * Container for object/subobject attributes, tags and data.
 */
export const ObjectsViewCard = ({ objectID, subobjectID, isSubobject = false, isMulticolumnComposite = false, displayTimestamp = true }) => {
    const dispatch = useDispatch();
    const _id = isSubobject ? subobjectID : objectID;

    // Fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch missing object attributes and data
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(objectsViewCardOnLoadFetch(_id));

            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(_id) > 0) fetchData();
        else setError("Object not found.");
    }, [_id]);

    // Container classname
    const containerClassName = "objects-view-card-container"
        .concat(isSubobject ? " subobject" : "")
        .concat(isMulticolumnComposite ? " multicolumn": "");

    // Error message
    if (error.length > 0) return (
        <div className={containerClassName}>
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching) return (
        <div className={containerClassName}>
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    // Object card
    const tagList = !isSubobject && <ObjectsViewTagList objectID={objectID} />;

    return (
        <div className = {containerClassName}>
            <div className="objects-view-card-object-id">{_id}</div>
            <ObjectAttributes objectID={objectID} subobjectID={subobjectID} isSubobject={isSubobject} displayTimestamp={displayTimestamp} />
            <ObjectDataSwitch objectID={objectID} subobjectID={subobjectID} isSubobject={isSubobject} />
            {tagList}
        </div>
    );
};
