import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { Layout } from "../modules/layout/layout";
import { ObjectsListSideMenu } from "../page-parts/objects-list/side-menu";
import { ObjectsListHorizontalMenu } from "../page-parts/objects-list/menu";
import { TagsFilter } from "../page-parts/objects-list/tags-filter";
import { ObjectsListFieldBody } from "../page-parts/objects-list/field-body";

import { objectsOnLoadFetch } from "../../fetches/ui-objects-list";


/**
 * /objects/list page component.
 */
export const ObjectsListPage = () => {
    const dispatch = useDispatch();

    // On load action
    useEffect(() => {
        dispatch(objectsOnLoadFetch());
    }, []);

    const sideMenu = <ObjectsListSideMenu />;
    
    const body = (
        <>
            <ObjectsListHorizontalMenu />
            <TagsFilter />
            <ObjectsListFieldBody />
        </>
    );

    return <Layout sideMenu={sideMenu} body={body} />;
};
