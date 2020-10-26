import React from "react";

import SideMenuItemContainer from "../side-menu/./side-menu-item-container";
import SideMenuDialogContainer from "../side-menu/side-menu-dialog-container";
import SideMenuDialogButtonContainer from "../side-menu/side-menu-dialog-button-container";

import { editObjectOnSaveFetch, setObjectRedirectOnRender, setShowDeleteDialogObject, editObjectOnDeleteFetch } from "../../actions/object";
import { isFetchingObject, isFetchinOrShowingDialogObject } from "../../store/state-check-functions";

/*
    Side menu item factory for the edit object page.
*/
function getEditObjectPageSideMenuItems() {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Save" 
            isVisible={true} 
            isActive={ state => 
                    !isFetchingObject(state) && 
                    state.objectUI.currentObject.object_name.length >= 1 && state.objectUI.currentObject.object_name.length <= 255
            }
            onClick={ editObjectOnSaveFetch() }
            key={key++}
        />,

        <SideMenuItemContainer 
            itemJSX="Delete" 
            isVisible={ state => !state.objectUI.showDeleteDialog } 
            isActive={ state => !isFetchinOrShowingDialogObject(state) && state.objectUI.currentObject.object_id !== 0 }
            onClick={ setShowDeleteDialogObject(true) }
            key={key++}
        />,

        <SideMenuDialogContainer
            key={key++}
            message="Delete this object?"
            isVisible={ state => state.objectUI.showDeleteDialog }
            buttons={[
                <SideMenuDialogButtonContainer key={key++} text="Yes" CSSClass="side-menu-dialog-button-red" onClick={editObjectOnDeleteFetch()}/>,
                <SideMenuDialogButtonContainer key={key++} text="No" onClick={setShowDeleteDialogObject(false)}/>
            ]}
        />,

        <SideMenuItemContainer 
            itemJSX="Cancel" 
            isVisible={true} 
            isActive={ state => !isFetchingObject(state) }
            onClick={ setObjectRedirectOnRender("/objects") }
            key={key++}
        />
    ];
}

export default getEditObjectPageSideMenuItems;
