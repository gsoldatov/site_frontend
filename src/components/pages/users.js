import React, { useState } from "react";
import { useParams } from "react-router";

import { Layout } from "../modules/layout/layout";
import { ViewUser } from "../page-parts/users/view-user";
import { EditUser } from "../page-parts/users/edit-user";

import { enumLayoutTypes } from "../../util/enum-layout-types";

import StyleUsers from "../../styles/pages/users.css";


/**
 * User page component.
 */
export const UsersPage = () => {
    const { id } = useParams();

    // View/edit mode state
    const [isEditMode, setIsEditMode] = useState(false);

    // Display view mode 
    const body = isEditMode
        ? <EditUser setIsEditMode={setIsEditMode} />
        : <ViewUser setIsEditMode={setIsEditMode} />
    ;

    return <Layout body={body} layoutType={enumLayoutTypes.shortWidth} />;
};
