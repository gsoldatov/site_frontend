import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Redirect, useLocation } from "react-router-dom";
import { Loader, Message } from "semantic-ui-react";

import { compositeChaptersOnLoadFetch } from "../../../../fetches/ui-objects-view";
import { getChaptersHierarchySelector, getHierarchyElements } from "../../../../store/state-util/ui-objects-view";
import { TableOfContents } from "./table-of-contents";
import { ChapterObject } from "./chapter-object";


/**
 * Main content component for displaying composite object's data in "chapters" mode in <ObjectsViewCard>.
 * Fetches hierarchy data, builds hierarchy and displays appropriate component for the current hierarchy element.
 */
export const CompositeChapters = ({ objectID }) => {
    const dispatch = useDispatch();

    // Fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // On load fetch
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(compositeChaptersOnLoadFetch(objectID));

            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(objectID) > 0) fetchData();
        else setError("Object not found.");
    }, [objectID]);

    // Chapter hierarchy selector
    const chaptersHierarchySelector = useMemo(() => getChaptersHierarchySelector(objectID), [objectID]);
    const hierarchy = useSelector(chaptersHierarchySelector);

    // Get current chapter, corresponding object ID and type of component which should be displayed for it.
    const ch = (new URLSearchParams(useLocation().search)).get("ch");
    const hierarchyElements = getHierarchyElements(hierarchy, ch);

    // Error message
    if (error.length > 0) return (
        <div className="objects-view-data composite-chapters">
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching) return (
        <div className="objects-view-data composite-chapters">
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    switch(hierarchyElements.type) {
        // Render nothing if hierarchy is unavailable
        case "no hierarchy": 
            return null;
        
        // Redirect to main object if chapter is invalid
        case "invalid":
            return <Redirect to={`/objects/view/${objectID}`} />;        
        
        // Render table of contents for a composite object with "chapters" display mode
        case "contents":
            return (
                <div className="objects-view-data composite-chapters">
                    <TableOfContents hierarchyElements={hierarchyElements} />
                </div>
            );
        
        // Render object attributes and data for other objects
        case "object":
            return (
                <div className="objects-view-data composite-chapters">
                    <ChapterObject hierarchyElements={hierarchyElements} />
                </div>
            );
        
        default:
            throw (`Received an unexpected chapter type '${chapterObjectIDAndType.type}'`);
    }
};
