import React from "react";

import { Layout } from "../modules/layout/layout";
import { TagsListHorizontalMenu } from "../page-parts/tags-list/menu";
import { TagsListFieldBody } from "../page-parts/tags-list/field-body";
import { TagsListSideMenu } from "../page-parts/tags-list/side-menu";


/**
 * /tags/list page component.
 */
export const TagsListPage = () => {
    const sideMenu = <TagsListSideMenu />;
    const body = (
        <>
            <TagsListHorizontalMenu />
            <TagsListFieldBody />
        </>
    );

    return <Layout sideMenu={sideMenu} body={body} />;
};
