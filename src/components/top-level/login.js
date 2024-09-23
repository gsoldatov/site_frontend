import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import { Button, Message, Form } from "semantic-ui-react";

import Layout from "../common/layout";

import { loginFetch } from "../../fetches/auth";
import { setRedirectOnRender } from "../../actions/common";
import { setAuthInformation } from "../../actions/auth";

import StyleAuth from "../../styles/pages/auth.css";


const getDefaultErrors = () => ({ login: "", password: "", form: "" });

const _messages = {
    registrationComplete: "You have successfully registered. Login to continue."
};

/**
 * Login page component.
 */
export const LoginPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();

    // Form disable control
    const [isDisabled, setIsDisabled] = useState(false);

    // Form input state
    const [formValues, setFormValues] = useState({ login: "", password: "" });
    const handleFormChange = e => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
    };

    // Form & field errors
    const [errors, setErrors] = useState(getDefaultErrors());
    const loginError = errors.login.length > 0 ? { content: errors.login, pointing: "above" } : undefined;
    const passwordError = errors.password.length > 0 ? { content: errors.password, pointing: "above" } : undefined;
    const formHasError = errors.form.length > 0;

    // Form message
    const [message, setMessage] = useState("");
    const formHasMessage = message.length > 0;
    useEffect(() => {   // Set message based on URL query params
        const message = _messages[(new URLSearchParams(location.search)).get("message")];
        setMessage(message || "");
    }, []);

    // Sumbit logic
    const onSubmit = async e => {
        // Reset errors & freeze form
        e.preventDefault();
        setMessage("");
        setErrors(getDefaultErrors());
        setIsDisabled(true);

        // Submit credentials
        const result = await dispatch(loginFetch(formValues.login, formValues.password));
        
        // Handle errors
        if ("errors" in result) {
            setErrors({ ...getDefaultErrors(), ...result.errors });
            setIsDisabled(false);
            return;
        }

        // Handle successful login
        const redirectPath = (new URLSearchParams(location.search)).get("from") || "/";
        const decodedPath = decodeURIComponent(redirectPath);   // Deocde URL-encoded string        
        dispatch(setAuthInformation(result, { redirectOnRender: decodedPath }));    // Set auth auth info & `redirectOnRender` to avoid double redirect
    };

    const body = (
        <div className="auth-form-container">
            <Form className="auth-form" size="large" error={formHasError} success={formHasMessage} onSubmit={onSubmit}>
                <Message success content={message} />
                <Message error content={errors.form} />
                <Form.Input error={loginError} name="login" label="Login" disabled={isDisabled} value={formValues.login} onChange={handleFormChange}  />
                <Form.Input error={passwordError} name="password" label="Password" type="password" disabled={isDisabled} value={formValues.password} onChange={handleFormChange}  />
                <div className="auth-form-submit-button-container">
                    <Button type="submit" color="blue" disabled={isDisabled}>Sumbit</Button>
                </div>
                
            </Form>
        </div>
    );

    return <Layout body={body} />;
};
