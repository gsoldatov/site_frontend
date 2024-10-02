import React from "react";

import { Layout } from "../modules/layout/layout";
import { TagsListFieldMenu } from "../page-parts/tags-list/field-menu";
import { TagsListFieldBody } from "../page-parts/tags-list/field-body";
import { TagsListSideMenu } from "../page-parts/tags-list/side-menu";


/**
 * /tags/list page component.
 */
export const TagsListPage = () => {
    const sideMenu = <TagsListSideMenu />;
    const body = (
        <>
            <TagsListFieldMenu />
            <TagsListFieldBody />
        </>
    );

    return <Layout sideMenu={sideMenu} body={body} />;
};
