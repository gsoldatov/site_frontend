import React from "react";
import { useParams } from "react-router-dom";

import { TagsEdit } from "../page-parts/tags-edit/tags-edit";
import { TagsEditNewSideMenu, TagsEditExistingSideMenu } from "../page-parts/tags-edit/side-menu";

import { loadTagsEditNewPage } from "../../reducers/ui/tags-edit";
import { tagsEditExistingLoadFetch } from "../../fetches/ui/tags-edit";

import StyleTag from "../../styles/pages/tags-edit.css";


/**
    /objects/edit/:id page component for new tags.
*/
export const TagsEditNewPage = () => {
    const sideMenu = <TagsEditNewSideMenu />;

    return <TagsEdit sideMenu={sideMenu} onLoad={loadTagsEditNewPage()} header="Add a New Tag" />;
};


/**
    /objects/edit/:id page component for existing tags.
*/
export const TagsEditExistingPage = () => {
    const { id } = useParams();

    const sideMenu = <TagsEditExistingSideMenu />;

    return <TagsEdit sideMenu={sideMenu} onLoad={tagsEditExistingLoadFetch(id)} header="Tag Information" />;
};
