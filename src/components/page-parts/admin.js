import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Form, Loader, Message } from "semantic-ui-react";

import { settingsUpdateFetch } from "../../fetches/data-settings";
import { settingsViewAllFetch } from "../../fetches/data/settings";

/**
 * Settings tab pane.
 */
export const SettingsTabPane = () => {
    const dispatch = useDispatch();

    // Fetch, message and form disable state
    const [isFetching, setIsFetching] = useState(true);
    const [message, setMessage] = useState({ type: "", content: "" });
    const [isDisabled, setIsDisabled] = useState(false);
    

    // Settings state and change handler
    const [settings, setSettings] = useState({});
    const handleFormChange = (e, data) => {
        const value = ["non_admin_registration_allowed"].includes(data.name) ? data.checked : data.value;
        setSettings({ ...settings, [data.name]: value });
    };

    // Get settings on component load
    useEffect(() => {
        const viewFetch = async () => {
            const result = await dispatch(settingsViewAllFetch());
            if (result.failed) {
                setMessage({ type: "error", content: result.error });
                setIsFetching(false);
            } else if ("settings" in result) {
                setSettings(result.settings);
                setIsFetching(false);
            }
        };

        viewFetch();
    }, []);

    // Update button click handler
    const onUpdate = async e => {
        // Reset errors & message and freeze form
        e.preventDefault();
        setMessage({ type: "", content: "" });
        setIsDisabled(true);

        // Run update fetch
        const result = await dispatch(settingsUpdateFetch(settings));
        
        // Handle errors & messages and enable form
        if ("error" in result) setMessage({ type: "error", content: result.error });
        if ("message" in result) setMessage({ type: "info", content: result.message });
        if (Object.keys(result).length > 0) setIsDisabled(false);   // don't update form if an empty object was returned (to avoid updating unmounted components)
    };

    // Loading placeholder
    if (isFetching) return <Loader active inline="centered">Loading...</Loader>;

    // Message
    const msg = message.content.length > 0 && (
        <Message className="user-page-edit-message" content={message.content}
            error={message.type === "error"} success={message.type === "success"} info={message.type === "info"} />
    );
    
    // Form
    const form = Object.keys(settings).length > 0 && (
        <Form size="large" autoComplete="off">
            <Form.Checkbox name="non_admin_registration_allowed" label="Non-admin registration allowed" 
                disabled={isDisabled} checked={settings.non_admin_registration_allowed} onChange={handleFormChange} />

            <Button color="green" disabled={isDisabled} onClick={onUpdate}>Update</Button>
        </Form>
    );
    
    return (
        <>
            {msg}
            {form}
        </>
    );
};
