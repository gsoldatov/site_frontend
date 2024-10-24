import React from "react";
import { useParams } from "react-router-dom";

import { TagsEdit } from "../page-parts/tags-edit/tags-edit";
import { TagsEditNewSideMenu, TagsEditExistingSideMenu } from "../page-parts/tags-edit/side-menu";

import { loadNewTagPage } from "../../actions/tags-edit";
import { editTagOnLoadFetch } from "../../fetches/ui-tags-edit";

import StyleTag from "../../styles/pages/tags-edit.css";


/**
    /objects/edit/:id page component for new tags.
*/
export const TagsEditNewPage = () => {
    const sideMenu = <TagsEditNewSideMenu />;

    return <TagsEdit sideMenu={sideMenu} onLoad={loadNewTagPage()} header="Add a New Tag" />;
};


/**
    /objects/edit/:id page component for existing tags.
*/
export const TagsEditExistingPage = () => {
    const { id } = useParams();

    const sideMenu = <TagsEditExistingSideMenu />;

    return <TagsEdit sideMenu={sideMenu} onLoad={editTagOnLoadFetch(id)} header="Tag Information" />;
};
