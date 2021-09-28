import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import { Button, Message, Form } from "semantic-ui-react";

import Layout from "../common/layout";

import { loginFetch } from "../../fetches/auth";
import { setRedirectOnRender } from "../../actions/common";

import StyleAuth from "../../styles/auth.css";


const getDefaultErrors = () => ({ login: "", password: "", form: "" });

/**
 * Login page component.
 */
export const LoginPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();

    // Form disable property
    const [isDisabled, setIsDisabled] = useState(false);

    // Form & field errors
    const [errors, setErrors] = useState(getDefaultErrors());
    const loginError = errors.login.length > 0 ? { content: errors.login, pointing: "above" } : undefined;
    const passwordError = errors.password.length > 0 ? { content: errors.password, pointing: "above" } : undefined;
    const formHasError = errors.form.length > 0;

    // Sumbit logic
    const onSubmit = useMemo(() => async e => {
        // Reset errors & freeze form
        e.preventDefault();
        setErrors(getDefaultErrors());
        setIsDisabled(true);

        // Submit credentials
        const result = await dispatch(loginFetch(e.target.login.value, e.target.password.value));

        // Unfreeze form
        setIsDisabled(false);
        
        // Handle errors
        if ("errors" in result) {
            setErrors({ ...getDefaultErrors(), ...result.errors });
            return;
        }

        // Handle successful login
        const redirectPath = (new URLSearchParams(location.search)).get("from") || "/";
        dispatch(setRedirectOnRender(redirectPath));
    }, [location]);

    const body = (
        <div className="auth-form-container">
            <Form className="auth-form" size="large" error={formHasError} onSubmit={onSubmit}>
                <Message error content={errors.form} />
                <Form.Input error={loginError} name="login" label="Login" disabled={isDisabled} />
                <Form.Input error={passwordError} name="password" label="Password" type="password" disabled={isDisabled} />
                <div className="auth-form-submit-button-container">
                    <Button type="submit" color="blue" disabled={isDisabled}>Sumbit</Button>
                </div>
                
            </Form>
        </div>
    );

    return <Layout body={body} />;
};
