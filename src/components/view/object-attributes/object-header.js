import React from "react";
import { useSelector } from "react-redux";

import { Link } from "react-router-dom";
import { Button, Header } from "semantic-ui-react";

import { enumUserLevels } from "../../../util/enum-user-levels";


/**
 * Object view page timestamp
 */
export const ObjectHeader = ({ objectID, isSubobject = false }) => {
    const headerTag = isSubobject ? "h2" : "h1";
    const text = useSelector(state => state.objects[objectID].object_name);

    // Edit button
    const canEdit = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin || state.auth.user_id === state.objects[objectID].owner_id);

    const editButton = canEdit && (
        <Link className="objects-view-header-button-container" to={`/objects/edit/${objectID}`} title="Edit object">
            <Button className="objects-view-header-button" basic icon="pencil" color="black" size="small" />
        </Link>
    );

    // View button
    const canView = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin || state.objects[objectID].is_published);

    const viewButton = isSubobject && canView && (
        <Link className="objects-view-header-button-container" to={`/objects/view/${objectID}`} title="View object">
            <Button className="objects-view-header-button" basic icon="eye" color="black" size="small" />
        </Link>
    );

    return (
        <div className="object-view-header-container">
            <Header as={headerTag}>{text}</Header>
            {editButton}
            {viewButton}
        </div>
    );
};
