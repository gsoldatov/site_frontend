import React from "react";

import SideMenuItemContainer from "../side-menu/./side-menu-item-container";
import SideMenuDialogContainer from "../side-menu/side-menu-dialog-container";
import SideMenuDialogButtonContainer from "../side-menu/side-menu-dialog-button-container";

import { editTagOnSaveFetch, setTagRedirectOnRender, setShowDeleteDialogTag, editTagOnDeleteFetch } from "../../actions/tag";
import { isFetchingTag, isFetchinOrShowingDialogTag } from "../../store/state-check-functions";

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
            isActive={ state => !isFetchinOrShowingDialogTag(state) && state.tagUI.currentTag.tag_id !== 0 }
            onClick={ setShowDeleteDialogTag(true) }
            key={key++}
        />,

        <SideMenuDialogContainer
            key={key++}
            message="Delete this tag?"
            isVisible={ state => state.tagUI.showDeleteDialog }
            buttons={[
                <SideMenuDialogButtonContainer key={key++} text="Yes" CSSClass="side-menu-dialog-button-red" onClick={editTagOnDeleteFetch()}/>,
                <SideMenuDialogButtonContainer key={key++} text="No" onClick={setShowDeleteDialogTag(false)}/>
            ]}
        />,

        <SideMenuItemContainer 
            itemJSX="Cancel" 
            isVisible={true} 
            isActive={ state => !isFetchingTag(state) }
            onClick={ setTagRedirectOnRender("/tags") }
            key={key++}
        />
    ];
}

export default getEditTagPageSideMenuItems;
