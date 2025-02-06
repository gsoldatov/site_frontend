import React from "react";
import { useSelector } from "react-redux";

import { Link } from "react-router-dom";
import { Button, Header } from "semantic-ui-react";

import { NumericUserLevel } from "../../../../types/store/data/auth";


/**
 * Header with object name and edit/view buttons, displayed inside an <ObjectsViewCard>.
 */
export const Header_ = ({ objectID, headerProps = {} }) => {
    // Get props
    const { headerTag = "h1", wrapHeaderInLink = true,
        displayEditButton = true, displayViewButton = true } = headerProps;

    // Header prefix text <span>
    const headerPrefix = headerProps.prefixText && <span className="objects-view-header-prefix">{headerProps.prefixText}</span>;

    // Header text <span>
    const text = useSelector(state => (state.objects[objectID] || {}).object_name);
    const headerText = <span className="objects-view-header-text">{text}</span>;

    // Header
    let header = (
        <Header className="objects-view-header" as={headerTag}>
            {headerPrefix}
            {headerText}
        </Header>
    );

    if (wrapHeaderInLink) header = <Link className="objects-view-header-text-link" to={`/objects/view/${objectID}`}>{header}</Link>;

    // Edit button
    const renderEditButton = useSelector(state => displayEditButton && (state.auth.numeric_user_level === NumericUserLevel.admin || state.auth.user_id === (state.objects[objectID] || {}).owner_id));

    const editButton = renderEditButton && (
        <Link className="objects-view-header-button-container" to={`/objects/edit/${objectID}`} title="Edit object">
            <Button className="objects-view-header-button" basic icon="pencil" color="black" size="small" />
        </Link>
    );

    // View button
    const renderViewButton = useSelector(state => displayViewButton && (state.auth.numeric_user_level === NumericUserLevel.admin || (state.objects[objectID] || {}).is_published));

    const viewButton = renderViewButton && (
        <Link className="objects-view-header-button-container" to={`/objects/view/${objectID}`} title="View object">
            <Button className="objects-view-header-button" basic icon="eye" color="black" size="small" />
        </Link>
    );

    // Result
    return (
        <div className="objects-view-header-container">
            {header}
            {editButton}
            {viewButton}
        </div>
    );
};
