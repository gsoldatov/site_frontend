import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { Button, Message, Form, Loader, Header } from "semantic-ui-react";

import Layout from "../common/layout";

import { getNonCachedUsers, updateUsersFetch } from "../../fetches/data-users";
import { enumUserLevels, userLevelInfo } from "../../util/enum-user-levels";

import StyleUser from "../../styles/user.css";


/**
 * User page component.
 */
export const UserPage = () => {
    const { id } = useParams();

    // View/edit mode state
    const [isEditMode, setIsEditMode] = useState(false);

    const body = isEditMode
        ? <EditUser setIsEditMode={setIsEditMode} />
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
            if ("error" in result) setError(result.error);
            setIsFetching(false);
        };
        
        if (parseInt(id) > 0) fetchData();
        else setError("User not found.");
    }, [id, fullViewMode]);

    // Error message
    if (error.length > 0) return (
        <Message error content={error} />
    );

    // Loading placeholder
    if (isFetching || user === undefined) return (
        <Loader active inline="centered">Loading...</Loader>
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


// const getDefaultErrors = () => ({ login: "", password: "", passwordRepeat: "", username: "", token_owner_password: "", form: "" });  // TODO replace
const getDefaultErrors = () => ({ login: "", password: "", passwordRepeat: "", username: "", token_owner_password: "" });

/**
 * Edit user data component.
 */
const EditUser = ({ setIsEditMode }) => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const fullViewMode = useSelector(state => state.auth.user_level === enumUserLevels.admin);
    const user = useSelector(state => state.users[id]);

    // Form disable control
    const [isDisabled, setIsDisabled] = useState(false);

    // Form input state
    const [formValues, setFormValues] = useState({ login: "", password: "", passwordRepeat: "", username: "", 
        user_level: user.user_level, can_login: user.can_login, can_edit_objects: user.can_edit_objects, token_owner_password: "" });
    const handleFormChange = (e, data) => {
        // console.log("IN handleFormChange, e.target.name = ", e.target.name, ", type = ", e.type, ", e.target.value = ", e.target.value)
        // console.log(data)
        // console.log(Object.keys(e))
        setFormValues({ ...formValues, [data.name]: data.value });
    };

    // Form & field errors
    const [errors, setErrors] = useState(getDefaultErrors());
    const loginError = errors.login.length > 0 ? { content: errors.login, pointing: "above" } : undefined;
    const passwordError = errors.password.length > 0 ? { content: errors.password, pointing: "above" } : undefined;
    const passwordRepeatError = errors.passwordRepeat.length > 0 ? { content: errors.passwordRepeat, pointing: "above" } : undefined;
    const usernameError = errors.username.length > 0 ? { content: errors.username, pointing: "above" } : undefined;
    const tokenOwnerPasswordError = errors.token_owner_password.length > 0 ? { content: errors.token_owner_password, pointing: "above" } : undefined;

    // Form message
    const [formMessage, setFormMessage] = useState({ type: "", content: "" });

    // Update button click handler
    const onUpdate = async e => {
        // Reset errors & message and freeze form
        e.preventDefault();
        setErrors(getDefaultErrors());
        setFormMessage({ type: "", content: "" });
        setIsDisabled(true);

        // Run fetch to update user data
        const updates = { ...formValues, user_id: id };
        const result = await dispatch(updateUsersFetch(updates));
        
        // Handle errors & messages and enable form
        if ("errors" in result) setErrors({ ...getDefaultErrors(), ...result.errors });        
        if ("message" in result) setFormMessage(result.message);
        if (Object.keys(result).length > 0) setIsDisabled(false);   // don't update form if an empty object was return (to avoid updating unmounted components)
    };

    const onCancel = useMemo(() => () => setIsEditMode(false), [setIsEditMode]);

    // Message box
    const message = formMessage.content.length > 0 && (
        <div className="user-page-edit-message-container">
            <Message className="user-page-edit-message" content={formMessage.content}
                error={formMessage.type === "error"} success={formMessage.type === "success"} info={formMessage.type === "info"} />
        </div>
    );

    const adminFields = fullViewMode && (
        <>
            <Form.Select name="user_level" label="User level" disabled={isDisabled} options={userLevelInfo} value={formValues.user_level} onChange={handleFormChange} />

            <Form.Group widths="equal">
                <Form.Checkbox name="can_login" label="Can login" disabled={isDisabled} checked={formValues.can_login} onChange={handleFormChange} />
                <Form.Checkbox name="can_edit_objects" label="Can edit objects" disabled={isDisabled} checked={formValues.can_edit_objects} onChange={handleFormChange} />
            </Form.Group>
        </>
    );

    return (
        <>
            <Header as="h3" className="user-page-edit-header">{`Update User Data of ${user.username}`}</Header>
            {message}
            <div className="user-page-form-container">
                <Form className="user-page-form" size="large" autoComplete="off" onSubmit={onUpdate}>
                    <Form.Input error={loginError} name="login" label="New login" disabled={isDisabled} value={formValues.login} onChange={handleFormChange} />
                    <Form.Group widths="equal">
                        <Form.Input error={passwordError} name="password" label="New password" type="password" disabled={isDisabled} value={formValues.password} onChange={handleFormChange} />
                        <Form.Input error={passwordRepeatError} name="passwordRepeat" label="Repeat new password" type="password" disabled={isDisabled} value={formValues.passwordRepeat} onChange={handleFormChange} />
                    </Form.Group>
                    <Form.Input error={usernameError} name="username" label="New username" disabled={isDisabled} value={formValues.username} onChange={handleFormChange} />

                    {adminFields}

                    <Form.Input error={tokenOwnerPasswordError} name="token_owner_password" label="Your current password" type="password" disabled={isDisabled} value={formValues.token_owner_password} onChange={handleFormChange} required />

                    <div className="user-page-form-button-container">
                        <Button type="submit" color="green" disabled={isDisabled}>Update</Button>
                        <Button color="red" disabled={isDisabled} onClick={onCancel}>Cancel</Button>
                    </div>
                </Form>
            </div>
        </>
    );
};
