import React from "react";
import moment from "moment";

import { Link } from "react-router-dom";
import { Header, Icon } from "semantic-ui-react";

import { useParsedMarkdownState } from "../../../util/use-parsed-markdown-state";


/**
 * Feed card container component.
 * 
 * Renders card borders and provided children inside.
 */
export const FeedCard = ({ children }) => {
    return children && (
        <div className="feed-card">
            {children}
        </div>
    );
};


export const FeedCardTimestamp = ({ timestamp }) => {
    if (!timestamp) return null;

    const formattedTimestamp = moment(timestamp).format("lll");

    return (
        <div className="feed-card-timestamp timestamp-text">
            {formattedTimestamp}
        </div>
    );
};


/**
 * Feed card header component.
 */
export const FeedCardHeader = ({ text, URL, icon, iconTitle }) => {
    if (!text) return null;

    const headerIcon = icon && <Icon className="feed-card-header-icon" name={icon} title={iconTitle} />;

    return (
        <div className="feed-card-header-container">
            <Link to={URL}>
                {headerIcon}
                <Header as="h2" className="feed-card-header">
                    {text}
                </Header>
            </Link>
        </div>
    );
};


/**
 * Feed card description component.
 */
export const FeedCardDescription = ({ text }) => {
    let parsed = useParsedMarkdownState(text);

    if (!text) return null;

    return parsed && (
        <div className="feed-card-description">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsed }} />
        </div>
    );
};
