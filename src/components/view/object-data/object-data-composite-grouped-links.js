import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { Link } from "react-router-dom";
import { Loader, Message, Header, Table } from "semantic-ui-react";

import { groupedLinksOnLoad } from "../../../fetches/ui-objects-view";

import { ObjectsViewCard } from "../objects-view-card";



/**
 * Signle-column representation of a composite object's object data display component on the /objects/view/:id page.
 * All non-link objects are displayed first, followed by a table with all link subobjects.
 */
export const ObjectDataCompositeGroupedLinks = ({ objectID }) => {
    const dispatch = useDispatch();

    // Fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch missing object attributes and data
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(groupedLinksOnLoad(objectID));

            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(objectID) > 0) fetchData();
        else setError("Object not found.");
    }, [objectID]);

    // Error message
    if (error.length > 0) return (
        <div className="objects-view-data composite-grouped-links">
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching) return (
        <div className="objects-view-data composite-grouped-links">
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    return (
        <div className="objects-view-data composite-grouped-links">
            <GroupedLinksOther objectID={objectID} />
            <GroupedLinksCard objectID={objectID} />
        </div>
    );
};


/**
 * Non-link subobjects for <ObjectDataCompositeGroupedLinks> component.
 */
const GroupedLinksOther = ({ objectID }) => {
    const subobjects = useSelector(state => state.composite[objectID].subobjects);
    const nonLinkSubobjectIDsSelector = createSelector(
        state => state.composite[objectID].subobjects,
        state => state.objects,
        (subobjects, objects) => Object.keys(subobjects).filter(subobjectID => objects[subobjectID].object_type !== "link")
    );
    const nonLinkSubobjectIDs = useSelector(nonLinkSubobjectIDsSelector);

    // Exit if there is no non-link subobjects
    if (nonLinkSubobjectIDs.length === 0) return null;

    // Sort subobjects by column -> row asc
    const subobjectIDOrder = nonLinkSubobjectIDs.slice().sort((a, b) => {
        if (subobjects[a].column < subobjects[b].column) return -1;
        if (subobjects[a].column === subobjects[b].column && subobjects[a].row < subobjects[b].row) return -1;
        return 1;
    });

    const subobjectCards = subobjectIDOrder.map((subobjectID, key) => <ObjectsViewCard key={key} objectID={objectID} subobjectID={subobjectID} isSubobject />);

    return <>{subobjectCards}</>;
};


/**
 * Link subobjects for <ObjectDataCompositeGroupedLinks> component.
 */
const GroupedLinksCard = ({ objectID }) => {
    const subobjects = useSelector(state => state.composite[objectID].subobjects);
    const linkSubobjectIDsSelector = createSelector(
        state => state.composite[objectID].subobjects,
        state => state.objects,
        (subobjects, objects) => Object.keys(subobjects).filter(subobjectID => objects[subobjectID].object_type === "link")
    );
    const linkSubobjectIDs = useSelector(linkSubobjectIDsSelector);

    // Exit if there is no non-link subobjects
    if (linkSubobjectIDs.length === 0) return null;

    // Header
    const header = (
        <div className="object-view-header-container">
            <Header as="h2">Links</Header>
        </div>
    );

    // Links table
    // Sort subobjects by column -> row asc
    const subobjectIDOrder = linkSubobjectIDs.slice().sort((a, b) => {
        if (subobjects[a].column < subobjects[b].column) return -1;
        if (subobjects[a].column === subobjects[b].column && subobjects[a].row < subobjects[b].row) return -1;
        return 1;
    });

    const rows = subobjectIDOrder.map((subobjectID, k) => <GroupedLinksTableRow key={k} subobjectID={subobjectID} />);

    const linksTable = (
        <Table className="grouped-links-table" striped>
            <Table.Body>
                {rows}
            </Table.Body>
        </Table>
    );

    return (
        <div className="objects-view-card-container subobject">
            {header}
            {linksTable}
        </div>
    )
};


/**
 * A single row in links table
 */
const GroupedLinksTableRow = ({ subobjectID }) => {
    const object = useSelector(state => state.objects[subobjectID]);
    const link = useSelector(state => state.links[subobjectID].link);

    if (!object) return null;


    return (
        <Table.Row>
            <Table.Cell>
                <a href={link}>
                    {object.object_name}
                </a>
                {/* <Link  to={link}>
                    {object.object_name}
                </Link> */}
            </Table.Cell>

            <Table.Cell>
                {object.object_description}
            </Table.Cell>
        </Table.Row>
    );
};
