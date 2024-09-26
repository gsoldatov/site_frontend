import React, { useEffect, useMemo } from "react";
import { Header } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Layout from "../../common/layout";
import { LoadIndicatorAndError, SaveError } from "../../edit/common/edit-page";
import { TagTimestamps, TagNameDescription } from "./attributes";
import { TagDisplayContainer } from "./display";


/**
 * /tags/edit/:id base component
 */
export const TagsEdit = ({ header, sideMenuItems, onLoad }) => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // On load action (also triggers when tag ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [id]);

    // Render loader/error or body
    const { isFetching, fetchError } = useSelector(state => state.tagUI.tagOnLoadFetch);

    let body = isFetching || fetchError ?
        <LoadIndicatorAndError isFetching={isFetching} fetchError={fetchError} />
    : (
        <>
            <Header as="h1" className="add-edit-page-header">{header}</Header>
            <TagSaveError />
            <TagTimestamps />
            <TagNameDescription />
            <TagDisplayContainer />
        </>
    );

    body = (
        <div className="tag-edit-page-container">
            {body}
        </div>
    );

    return <Layout sideMenuItems={sideMenuItems} body={body} />;
};


/**
 * Save fetch error message
 * */
const TagSaveError = () => {
    const fetchSelector = useMemo(() => state => state.tagUI.tagOnSaveFetch, []);
    return <SaveError fetchSelector={fetchSelector} />;
};

