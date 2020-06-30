import React from "react";

import SideMenuItemContainer from "./side-menu-item-container";
import SideMenuDialogContainer from "./side-menu-dialog-container";
import SideMenuDialogButtonContainer from "./side-menu-dialog-button-container";

import { setTagsRedirectOnRender, setShowDeleteDialogTags, onDeleteFetch } from "../actions/tags";
import { isFetchingTags, isFetchinOrShowingDialogTags } from "../store/state-check-functions";

/*
    Side menu item factory for the tags page.
*/
function getTagsPageSideMenuItems(selectedTagID) {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Add Tag" 
            isVisible={true} 
            isActive={true}
            onClick={ setTagsRedirectOnRender("/tags/add") }
            key={key++}
        />,

        <SideMenuItemContainer 
            itemJSX="Edit Tag" 
            isVisible={true} 
            isActive={ state => state.tagsUI.selectedTagIDs.length === 1 }
            onClick={ setTagsRedirectOnRender(`/tags/${selectedTagID}`) }
            // onClick={ () => console.log("Clicked edit tag button") }
            key={key++}
        />,

        <SideMenuItemContainer
            itemJSX="Delete" 
            isVisible={ state => !state.tagsUI.showDeleteDialog } 
            isActive={ state => !isFetchinOrShowingDialogTags(state) && state.tagsUI.selectedTagIDs.length > 0 }
            onClick={ setShowDeleteDialogTags(true) }
            key={key++}
        />,

        <SideMenuDialogContainer
            key={key++}
            message="Delete this tag?"
            isVisible={ state => state.tagsUI.showDeleteDialog }
            buttons={[
                <SideMenuDialogButtonContainer key={key++} text="Yes" CSSClass="side-menu-dialog-button-red" onClick={onDeleteFetch()}/>,
                <SideMenuDialogButtonContainer key={key++} text="No" onClick={setShowDeleteDialogTags(false)}/>
            ]}
        />,
    ];
}

export default getTagsPageSideMenuItems;
