import React from "react";
import { useSelector } from "react-redux";

import { Link } from "react-router-dom";
import { Button, Header } from "semantic-ui-react";

import { enumUserLevels } from "../../../../util/enums/enum-user-levels";


/**
 * Header with object name and edit/view buttons, displayed inside an <ObjectsViewCard>.
 */
export const Header_ = ({ objectID, headerProps = {} }) => {
    // Get props
    const headerTag = headerProps.headerTag !== undefined ? headerProps.headerTag : "h1";
    const displayEditButton = headerProps.displayEditButton !== undefined ? headerProps.displayEditButton : true;
    const displayViewButton = headerProps.displayViewButton !== undefined ? headerProps.displayViewButton : true;

    // Header prefix text <span>
    const headerPrefix = headerProps.prefixText && <span className="objects-view-header-prefix">{headerProps.prefixText}</span>;

    // Header text <span>
    const text = useSelector(state => (state.objects[objectID] || {}).object_name);
    const headerText = <span className="objects-view-header-text">{text}</span>;

    // Edit button
    const renderEditButton = useSelector(state => displayEditButton && (state.auth.numeric_user_level === enumUserLevels.admin || state.auth.user_id === (state.objects[objectID] || {}).owner_id));

    const editButton = renderEditButton && (
        <Link className="objects-view-header-button-container" to={`/objects/edit/${objectID}`} title="Edit object">
            <Button className="objects-view-header-button" basic icon="pencil" color="black" size="small" />
        </Link>
    );

    // View button
    const renderViewButton = useSelector(state => displayViewButton && (state.auth.numeric_user_level === enumUserLevels.admin || (state.objects[objectID] || {}).is_published));

    const viewButton = renderViewButton && (
        <Link className="objects-view-header-button-container" to={`/objects/view/${objectID}`} title="View object">
            <Button className="objects-view-header-button" basic icon="eye" color="black" size="small" />
        </Link>
    );

    // Result
    return (
        <div className="objects-view-header-container">
            <Header className="objects-view-header" as={headerTag}>
                {headerPrefix}
                {headerText}
            </Header>
            {editButton}
            {viewButton}
        </div>
    );
};
