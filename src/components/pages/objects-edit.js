import React from "react";
import { useParams } from "react-router-dom";

import { ObjectsEdit } from "../page-parts/objects-edit/objects-edit";
import { ObjectsEditNewSideMenu, ObjectsEditExistingSideMenu } from "../page-parts/objects-edit/side-menu";

import { objectsEditNewOnLoad, objectsEditExistingOnLoad } from "../../fetches/ui-objects-edit";

import StyleObjectsEdit from "../../styles/pages/objects-edit.css";



/**
    /objects/edit/:id page component for new objects.
*/
export const ObjectsEditNewPage = () => {
    const sideMenu = <ObjectsEditNewSideMenu />;
    return <ObjectsEdit sideMenu={sideMenu} objectID={0} onLoad={objectsEditNewOnLoad()} header="Add a New Object" />;
};


/**
    /objects/edit/:id page component for existing objects.
*/
export const ObjectsEditExistingPage = () => {
    let { id } = useParams();
    id = parseInt(id);

    const sideMenu = <ObjectsEditExistingSideMenu />;    

    return <ObjectsEdit sideMenu={sideMenu} objectID={id} onLoad={objectsEditExistingOnLoad(id)} header="Object Information" />;
};
