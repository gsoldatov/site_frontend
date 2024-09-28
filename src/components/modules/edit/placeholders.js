import React from "react";
import { Loader } from "semantic-ui-react";
import { useSelector } from "react-redux";

import { ErrorMessage } from "../../modules/error-message";


/**
 * On load fetch indication & error.
 */
export const LoadIndicatorAndError = ({ isFetching, fetchError, loadingMessage = "Loading..." }) => {
    if (isFetching) return <Loader active inline="centered">{loadingMessage}</Loader>;
    if (fetchError) return <ErrorMessage text={fetchError}/>;
    return null;
}


/**
 * Save fetch error message.
 */
export const SaveError = ({ fetchSelector }) => {
    const fetch = useSelector(fetchSelector);
    if (fetch.isFetching || !fetch.fetchError) return null;
    return <ErrorMessage header="" text={fetch.fetchError}/>;
};
