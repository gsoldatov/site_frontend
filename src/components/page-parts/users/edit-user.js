import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { Button, Message, Form, Header } from "semantic-ui-react";

import { usersUpdateFetch } from "../../../fetches/data/users";
import { NumericUserLevel, userLevelInfo } from "../../../types/store/data/auth";


const getDefaultErrors = () => ({ login: "", password: "", password_repeat: "", username: "", token_owner_password: "" });


/**
 * Edit user data component.
 */
export const EditUser = ({ setIsEditMode }) => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const fullViewMode = useSelector(state => state.auth.numeric_user_level === NumericUserLevel.admin);
    const user = useSelector(state => state.users[id]) || {};   // empty object is required to avoid errors when component is rendered after a logout was performed

    // Form disable control
    const [isDisabled, setIsDisabled] = useState(false);

    // Form input state
    const [formValues, setFormValues] = useState({ login: "", password: "", password_repeat: "", username: "", 
        user_level: user.user_level, can_login: user.can_login, can_edit_objects: user.can_edit_objects, token_owner_password: "" });
    const handleFormChange = (e, data) => {
        const value = ["can_login", "can_edit_objects"].includes(data.name) ? data.checked : data.value;
        setFormValues({ ...formValues, [data.name]: value });
    };

    // Form & field errors
    const [errors, setErrors] = useState(getDefaultErrors());
    const loginError = errors.login.length > 0 ? { content: errors.login, pointing: "above" } : undefined;
    const passwordError = errors.password.length > 0 ? { content: errors.password, pointing: "above" } : undefined;
    const passwordRepeatError = errors.password_repeat.length > 0 ? { content: errors.password_repeat, pointing: "above" } : undefined;
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
        const result = await dispatch(usersUpdateFetch(updates));
        
        // Handle errors & messages and enable form
        if ("errors" in result) setErrors({ ...getDefaultErrors(), ...result.errors });        
        if ("message" in result) setFormMessage(result.message);
        if (Object.keys(result).length > 0) setIsDisabled(false);   // don't update form if an empty object was returned (to avoid updating unmounted components)
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
                <Form className="user-page-form" size="large" autoComplete="off">
                    {/* Disable form autocompletion */}
                    <input type="text" style={{ display: "none" }} />
                    <input type="password" style={{ display: "none" }} />

                    <Form.Input error={loginError} name="login" label="New login" disabled={isDisabled} value={formValues.login} onChange={handleFormChange} />
                    <Form.Group widths="equal">
                        <Form.Input error={passwordError} name="password" label="New password" type="password" disabled={isDisabled} value={formValues.password} onChange={handleFormChange} />
                        <Form.Input error={passwordRepeatError} name="password_repeat" label="Repeat new password" type="password" disabled={isDisabled} value={formValues.password_repeat} onChange={handleFormChange} />
                    </Form.Group>
                    <Form.Input error={usernameError} name="username" label="New username" disabled={isDisabled} value={formValues.username} onChange={handleFormChange} />

                    {adminFields}

                    <Form.Input error={tokenOwnerPasswordError} name="token_owner_password" label="Your current password" type="password" disabled={isDisabled} value={formValues.token_owner_password} onChange={handleFormChange} required />

                    <div className="user-page-form-button-container">
                        <Button color="green" disabled={isDisabled} onClick={onUpdate}>Update</Button>
                        <Button color="red" disabled={isDisabled} onClick={onCancel}>Cancel</Button>
                    </div>
                </Form>
            </div>
        </>
    );
};
