import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { Button, Message, Loader, Header } from "semantic-ui-react";

import { getNonCachedUsers } from "../../../fetches/data/users";
import { NumericUserLevel } from "../../../store/types/data/auth";


/**
 * View user data component.
 */
export const ViewUser = ({ setIsEditMode }) => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const fullViewMode = useSelector(state => state.auth.numeric_user_level === NumericUserLevel.admin);
    const canEdit = useSelector(state => fullViewMode || state.auth.user_id === id);
    const user = useSelector(state => state.users[id]);

    // User fetch & error state
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Button on click
    const editModeButtonOnClick = useMemo(() => () => setIsEditMode(true), [setIsEditMode]);

    // Fetch missing user data
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(getNonCachedUsers([id], fullViewMode));
            if (result.error !== undefined) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(id) > 0) fetchData();
        else setError("User not found.");
    }, [id, fullViewMode]);

    // Error message
    if (error.length > 0) return (
        <div className = "user-page-view-container">
            <Message error content={error} />
        </div>
    );

    // Loading placeholder
    if (isFetching || user === undefined) return (
        <div className = "user-page-view-container">
            <Loader active inline="centered">Loading...</Loader>
        </div>
    );

    // User data
    const editButton = canEdit && (
        <div className="user-page-view-edit-mode-button-container" title="Edit user data">
            <Button className="user-page-view-edit-mode-button" basic icon="pencil" color="black" size="mini" onClick={editModeButtonOnClick} />
        </div>
    );
    const username = (
        <div className="user-page-view-header-container">
            <Header as="h3" className="user-page-view-username">{user.username}</Header>
            {editButton}
        </div>
    );
    const registeredAt = (
        <div className="user-page-view-item-container">
            <span className="user-page-view-item-title">Registered at: </span>
            <span className="user-page-view-item-value timestamp-text">{(new Date(user.registered_at)).toLocaleString()}</span>
        </div>
    );
    const userLevel = fullViewMode && (
        <div className="user-page-view-item-container">
            <span className="user-page-view-item-title">User level: </span>
            <span className="user-page-view-item-value">{user.user_level}</span>
        </div>
    );
    const canLogin = fullViewMode && (
        <div className="user-page-view-item-container">
            <span className="user-page-view-item-title">Can login: </span>
            <span className="user-page-view-item-value">{user.can_login ? "yes" : "no"}</span>
        </div>
    );
    const canEditObjects = fullViewMode && (
        <div className="user-page-view-item-container">
            <span className="user-page-view-item-title">Can edit objects: </span>
            <span className="user-page-view-item-value">{user.can_edit_objects ? "yes" : "no"}</span>
        </div>
    );

    return (
        <div className = "user-page-view-container">
            {username}
            {registeredAt}
            {userLevel}
            {canLogin}
            {canEditObjects}
        </div>
    );
};
