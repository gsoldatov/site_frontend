import React, { useEffect, useState } from "react";
import { Message } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { Layout } from "../modules/layout/layout";
import { ObjectsEditedConfirm } from "../page-parts/objects-edited/confirm";
import { ObjectsEditedTable } from "../page-parts/objects-edited/table";

import { loadObjectsEditedPage } from "../../actions/objects-edited";
import { enumLayoutTypes } from "../../util/enum-layout-types";

import StyleObjectsEdited from "../../styles/pages/objects-edited.css";


/**
 * /objects/edited page components.
 */
export const ObjectsEditedPage = () => {
    const dispatch = useDispatch();
    const editedObjectsExist = useSelector(state => Object.keys(state.editedObjects).length > 0);

    // Reset page UI on load
    useEffect(() => {
        dispatch(loadObjectsEditedPage());
    }, []);

    // Confirm state
    const [confirmState, setConfirmState] = useState({
        open: false,
        content: "",
        onConfirm: undefined,
        onCancel: undefined
    });

    // Render
    const body = editedObjectsExist ? (
        <>
            <ObjectsEditedConfirm confirmState={confirmState} setConfirmState={setConfirmState} />
            <ObjectsEditedTable setConfirmState={setConfirmState} />
        </>
    ) : (
        <Message info>No edited objects found.</Message>
    )

    return <Layout body={body} layoutType={enumLayoutTypes.shortWidth} />;
};
