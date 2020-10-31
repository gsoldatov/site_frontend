import React from "react";

import SideMenuItemContainer from "../side-menu/side-menu-item-container";
import SideMenuDialogContainer from "../side-menu/side-menu-dialog-container";
import SideMenuDialogButtonContainer from "../side-menu/side-menu-dialog-button-container";

import { setObjectsRedirectOnRender, setShowDeleteDialogObjects, onDeleteFetch } from "../../actions/objects";
import { isFetchinOrShowingDialogObjects } from "../../store/state-check-functions";

/*
    Side menu item factory for the objects page.
*/
function getObjectsPageSideMenuItems(selectedObjectID) {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Add Object" 
            isVisible={true} 
            isActive={ state => !isFetchinOrShowingDialogObjects(state) }
            onClick={ setObjectsRedirectOnRender("/objects/add") }
            key={key++}
        />,

        <SideMenuItemContainer 
            itemJSX="Edit Object" 
            isVisible={true} 
            isActive={ state => state.objectsUI.selectedObjectIDs.length === 1 && !isFetchinOrShowingDialogObjects(state) }
            onClick={ setObjectsRedirectOnRender(`/objects/${selectedObjectID}`) }
            key={key++}
        />,

        <SideMenuItemContainer
            itemJSX="Delete" 
            isVisible={ state => !state.objectsUI.showDeleteDialog } 
            isActive={ state => !isFetchinOrShowingDialogObjects(state) && state.objectsUI.selectedObjectIDs.length > 0 }
            onClick={ setShowDeleteDialogObjects(true) }
            key={key++}
        />,

        <SideMenuDialogContainer
            key={key++}
            message="Delete this object?"
            isVisible={ state => state.objectsUI.showDeleteDialog }
            buttons={[
                <SideMenuDialogButtonContainer key={key++} text="Yes" CSSClass="side-menu-dialog-button-red" onClick={onDeleteFetch()}/>,
                <SideMenuDialogButtonContainer key={key++} text="No" onClick={setShowDeleteDialogObjects(false)}/>
            ]}
        />,
    ];
}

export default getObjectsPageSideMenuItems;
