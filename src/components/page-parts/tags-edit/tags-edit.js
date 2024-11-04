import React, { useEffect, useMemo } from "react";
import { Header } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { Layout } from "../../modules/layout/layout";
import { LoadIndicatorAndError, SaveError } from "../../modules/edit/placeholders";
import { TagTimestamps, TagNameDescription } from "./attributes";
import { TagDisplayContainer } from "./display";


/**
 * /tags/edit/:id base component
 */
export const TagsEdit = ({ header, sideMenu, onLoad }) => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // On load action (also triggers when tag ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [id]);

    // Render loader/error or body
    const { isFetching, fetchError } = useSelector(state => state.tagsEditUI.tagOnLoadFetch);

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

    return <Layout sideMenu={sideMenu} body={body} />;
};


/**
 * Save fetch error message
 * */
const TagSaveError = () => {
    const fetchSelector = useMemo(() => state => state.tagsEditUI.tagOnSaveFetch, []);
    return <SaveError fetchSelector={fetchSelector} />;
};

