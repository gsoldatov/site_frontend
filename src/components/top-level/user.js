import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { Button, Message, Form, Loader, Header } from "semantic-ui-react";

import Layout from "../common/layout";

import { getNonCachedUsers } from "../../fetches/data-users";
import { setRedirectOnRender } from "../../actions/common";
import { enumUserLevels } from "../../util/enum-user-levels";

import StyleUser from "../../styles/user.css";


// const getDefaultErrors = () => ({ login: "", password: "", passwordRepeat: "", username: "", form: "" });    // TODO replace

/**
 * User page component.
 */
export const UserPage = () => {
    const { id } = useParams();

    // View/edit mode state
    const [isEditMode, setIsEditMode] = useState(false);

    const body = isEditMode
        ? <div>{`User ${id} page in edit mode.`}</div>  // TODO replace
        : <ViewUser setIsEditMode={setIsEditMode} />
    ;

    return <Layout body={body} />;
};


/**
 * View user data component.
 */
const ViewUser = ({ setIsEditMode }) => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const fullViewMode = useSelector(state => state.auth.user_level === enumUserLevels.admin);
    const user = useSelector(state => state.users[id]);

    // User fetch & error state
    const [isFetcing, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Fetch missing user data
    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            const result = await dispatch(getNonCachedUsers([id], fullViewMode));
            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        fetchData();
    }, [id, fullViewMode]);

    // Loading placeholder
    if (isFetcing || user === undefined) return (
        <Loader active inline="centered">Loading...</Loader>
    );

    // Error message
    if (error.length > 0) return (
        <Message error content={error} />
    );

    // User data
    const username = <Header as="h3" className="user-page-view-username">{user.username}</Header>;
    const registeredAt = (
        <div className="user-page-view-item-container">
            <span className="user-page-view-item-title">Registered at: </span>
            <span className="user-page-view-item-value">{(new Date(user.registered_at)).toLocaleString()}</span>
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
