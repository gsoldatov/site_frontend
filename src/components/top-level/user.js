import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import { Button, Message, Form } from "semantic-ui-react";

import Layout from "../common/layout";

import { registerFetch, registrationStatusFetch } from "../../fetches/auth";
import { setRedirectOnRender } from "../../actions/common";

import StyleAuth from "../../styles/auth.css";


// const getDefaultErrors = () => ({ login: "", password: "", passwordRepeat: "", username: "", form: "" });

/**
 * User page component.
 */
export const UserPage = () => {
    const { id } = useParams();

    return (
        <div>{`User ${id} page.`}</div>
    );
};
