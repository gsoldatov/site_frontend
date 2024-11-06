import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Message, Form } from "semantic-ui-react";

import { Layout } from "../modules/layout/layout";

import { registerFetch, registrationStatusFetch } from "../../fetches/auth";
import { setRedirectOnRender } from "../../reducers/common";

import StyleAuth from "../../styles/pages/auth.css";


const getDefaultErrors = () => ({ login: "", password: "", passwordRepeat: "", username: "", form: "" });

/**
 * Register page component.
 */
export const RegisterPage = () => {
    const dispatch = useDispatch();

    // Form disable control
    const [isDisabled, setIsDisabled] = useState(true);

    // Form input state
    const [formValues, setFormValues] = useState({ login: "", password: "", passwordRepeat: "", username: "" });
    const handleFormChange = e => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
    };

    // Form & field errors
    const [errors, setErrors] = useState(getDefaultErrors());
    const loginError = errors.login.length > 0 ? { content: errors.login, pointing: "above" } : undefined;
    const passwordError = errors.password.length > 0 ? { content: errors.password, pointing: "above" } : undefined;
    const passwordRepeatError = errors.passwordRepeat.length > 0 ? { content: errors.passwordRepeat, pointing: "above" } : undefined;
    const usernameError = errors.username.length > 0 ? { content: errors.username, pointing: "above" } : undefined;
    const formHasError = errors.form.length > 0;

    // Sumbit logic
    const onSubmit = async e => {
        // Reset errors & freeze form
        e.preventDefault();
        setErrors(getDefaultErrors());
        setIsDisabled(true);

        // Submit credentials
        const result = await dispatch(registerFetch(formValues.login, formValues.password, formValues.passwordRepeat, formValues.username));
        
        // Handle errors
        if ("errors" in result) {
            setErrors({ ...getDefaultErrors(), ...result.errors });
            setIsDisabled(false);
            return;
        }

        // Handle successful login
        dispatch(setRedirectOnRender("/auth/login?message=registrationComplete"));
    };

    // Fetch backend to check if registration is available and enable form, if so.
    useEffect(() => {
        const updateFormIsDisabled = async () => {
            const isRegistrationAllowed = await dispatch(registrationStatusFetch());
            if (isRegistrationAllowed) setIsDisabled(false);
            else (setErrors({ ...getDefaultErrors(), form: "Registration is currently unavailable." }));
        };
        updateFormIsDisabled();
    }, []);

    const body = (
        <div className="auth-form-container">
            <Form className="auth-form" size="large" autoComplete="off" error={formHasError} onSubmit={onSubmit}>
                <Message error content={errors.form} />
                <Form.Input error={loginError} name="login" label="Login" disabled={isDisabled} value={formValues.login} onChange={handleFormChange} />
                <Form.Input error={passwordError} name="password" label="Password" type="password" disabled={isDisabled} value={formValues.password} onChange={handleFormChange} />
                <Form.Input error={passwordRepeatError} name="passwordRepeat" label="Repeat password" type="password" disabled={isDisabled} value={formValues.passwordRepeat} onChange={handleFormChange} />
                <Form.Input error={usernameError} name="username" label="Username" disabled={isDisabled} value={formValues.username} onChange={handleFormChange} />
                <div className="auth-form-submit-button-container">
                    <Button type="submit" color="blue" disabled={isDisabled}>Register</Button>
                </div>
            </Form>
        </div>
    );

    return <Layout body={body} />;
};
