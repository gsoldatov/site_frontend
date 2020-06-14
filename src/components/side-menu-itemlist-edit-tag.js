import React from "react";

import SideMenuItemContainer from "./side-menu-item-container";
import SideMenuDialogContainer from "./side-menu-dialog-container";
import SideMenuDialogButtonContainer from "./side-menu-dialog-button-container";

import { editTagOnSaveFetch, setRedirectOnRender, setShowDeleteDialog } from "../actions/tag";
import { isFetchingTag, isFetchinOrShowingDialogTag } from "../store/state-check-functions";

/*
    Side menu item factory for the edit tag page.
*/
function getEditTagPageSideMenuItems() {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Save" 
            isVisible={true} 
            isActive={ state => 
                    !isFetchingTag(state) && 
                    state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255
            }
            onClick={ editTagOnSaveFetch() }
            key={key++}
        />,

        <SideMenuItemContainer 
            itemJSX="Delete" 
            isVisible={ state => !state.tagUI.showDeleteDialog } 
            isActive={ state => !isFetchinOrShowingDialogTag(state) }
            onClick={ setShowDeleteDialog(true) }
            key={key++}
        />,

        <SideMenuDialogContainer
            key={key++}
            message="Delete this tag?"
            isVisible={ state => state.tagUI.showDeleteDialog }
            buttons={[
                <SideMenuDialogButtonContainer key={key++} text="Yes" CSSClass="side-menu-dialog-button-red" onClick={setShowDeleteDialog(false)}/>,
                <SideMenuDialogButtonContainer key={key++} text="No" onClick={setShowDeleteDialog(false)}/>
            ]}
        />,

        <SideMenuItemContainer 
            itemJSX="Cancel" 
            isVisible={true} 
            isActive={ state => !isFetchingTag(state) }
            onClick={ setRedirectOnRender("/tags") }
            key={key++}
        />
    ];
}

export default getEditTagPageSideMenuItems;
