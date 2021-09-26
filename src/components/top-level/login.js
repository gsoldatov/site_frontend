import React, { memo, useEffect, useMemo, useRef } from "react";
import { Button, Form } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { createSelector } from "reselect";

import Layout from "../common/layout";


/**
 * Login page component.
 */
export const LoginPage = () => {
    const body = (
        <Form className="login-page-form">
            <Form.Input label="Login" />
            <Form.Input label="Password" type="password" />
            <Button type="submit">Sumbit</Button>
        </Form>
    );

    return <Layout body={body} />;
};
